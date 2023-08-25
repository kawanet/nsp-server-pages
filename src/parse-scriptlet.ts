import type {NSP} from "../index.js"

/**
 * Parser for Directive, Declaration, Scriptlet
 * <%-- comment --%>
 * <%@ directive %>
 * <%! declaration(s) %>
 * <% scriptlet %>
 * <%= expression %>
 */
export const parseScriptlet = (app: NSP.App, src: string) => new ScriptletParser(app, src);

const typeMap: { [key: string]: string } = {
    "<%-": "comment",
    "<%@": "directive",
    "<%!": "declaration",
    "<%=": "expression",
};

class ScriptletParser {
    constructor(protected app: NSP.App, protected src: string) {
        //
    }

    /**
     * Compile <% scriptlet %> to JavaScript function instance
     */
    toFn<T>() {
        const {app} = this;
        const {nspName} = app.options;

        const js = this.toJS();
        const isComment = /^\/\/[^\n]*$/s.test(js);
        if (isComment) return (): string => null;

        try {
            const fn = Function(nspName, `return ${js}`) as (app: NSP.App) => (v: T) => string;
            return fn(app);
        } catch (e) {
            app.log("ScriptletParser: " + js?.substring(0, 1000));
            throw e;
        }
    }

    /**
     * Transpile <% scriptlet %> to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption): string {
        const {app} = this;
        const {nspName, vName} = app.options;

        const currentIndent = +option?.indent || 0;
        const currentLF = currentIndent ? "\n" + " ".repeat(currentIndent) : "\n";

        let {src} = this;

        const type = typeMap[src.substring(0, 3)] || "scriptlet";
        if (type === "comment") {
            src = src.replace(/[ \t]*[\r\n]+/sg, `${currentLF}// `);
            return `// ${src}`;
        }

        app.log(`${type} found: ${src?.substring(0, 1000)}`);

        src = /`|\$\{/.test(src) ? JSON.stringify(src) : "`" + src + "`";

        src = `${vName} => ${nspName}.process("${type}", ${src}, ${vName})`;

        return src;
    }
}

import {parseEL} from "./parse-el.js";

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
        const {nspKey} = app.options;

        const js = this.toJS();
        const isComment = /^\/\/[^\n]*$/s.test(js);
        if (isComment) return (): string => null;

        try {
            const fn = Function(nspKey, `return ${js}`) as (app: NSP.App) => (v: T) => string;
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
        const {nspKey, vKey} = app.options;
        let {src} = this;

        const type = typeMap[src.substring(0, 3)] || "scriptlet";
        if (type === "comment") {
            src = src.replace(/\s\s+/sg, " ");
            return `// ${src}`;
        }

        if (type === "expression") {
            src = src.replace(/^<%=\s*/s, "");
            src = src.replace(/\s*%>$/s, "");
            src = parseEL(app, src).toJS(option);
            return `${vKey} => (${src})`;
        }

        app.log(`${type} found: ${src?.substring(0, 1000)}`);

        src = /`|\$\{/.test(src) ? JSON.stringify(src) : "`" + src + "`";

        src = `${vKey} => ${nspKey}.emit("${type}", ${src}, ${vKey})`;

        return src;
    }
}

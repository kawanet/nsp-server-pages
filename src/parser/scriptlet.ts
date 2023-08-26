import type {NSP} from "../../index.js";

const LF = (indent: number) => (+indent ? "\n" + " ".repeat(indent) : "\n");

const typeMap: { [key: string]: string } = {
    "<%-": "comment",
    "<%@": "directive",
    "<%!": "declaration",
    "<%=": "expression",
};

/**
 * Parser for Directive, Declaration, Scriptlet
 * <%-- comment --%>
 * <%@ directive %>
 * <%! declaration(s) %>
 * <% scriptlet %>
 * <%= expression %>
 */
export class Scriptlet {
    constructor(protected app: NSP.App, protected src: string) {
        //
    }

    /**
     * Transpile <% scriptlet %> to JavaScript source code
     */
    toJS(option: NSP.ToJSOption): string {
        const {app} = this;
        const {nspName, vName} = app.options;

        const currentIndent = +option?.currentIndent || 0;
        const currentLF = LF(currentIndent);

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

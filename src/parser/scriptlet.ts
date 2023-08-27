import type {NSP} from "../../index.js";

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
export class Scriptlet implements NSP.Transpiler {
    protected src: string;
    protected type: string;

    constructor(protected app: NSP.App, src: string) {
        const type = this.type = typeMap[src.substring(0, 3)] || "scriptlet";
        this.src = app.process<string>(`before.parse.${type}`, src) ?? src;
    }

    /**
     * Transpile <% scriptlet %> to JavaScript source code
     */
    toJS(option: NSP.ToJSOption) {
        const {app, src, type} = this;
        const js = app.process<string>(`parse.${type}`, src) ?? this._toJS(option);
        return app.process<string>(`after.parse.${type}`, js) ?? js;
    }

    private _toJS(option: NSP.ToJSOption): string {
        const {app, type} = this;
        const {nspName, vName} = app.options;
        const currentLF = option?.LF ?? "\n";

        let {src} = this;

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

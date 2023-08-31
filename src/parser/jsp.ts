import type {NSP} from "../../index.js";
import {Store} from "../store.js";
import {Scriptlet} from "./scriptlet.js";
import {Tag} from "./tag.js";

/**
 * Parser for JSP document
 */
export class JSP implements NSP.JspParser {
    protected src: string;

    constructor(protected app: NSP.App, src: string) {
        this.src = app.process<string>("before.parse.jsp", src) ?? src;
    }

    /**
     * Transpile JSP document to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption) {
        const {app, src} = this;
        const js = app.process<string>("parse.jsp", src) ?? jspToJS(app, src, option);
        return app.process<string>("after.parse.jsp", js) ?? js;
    }

    /**
     * Compile JSP document to JavaScript function
     */
    toFn<T>() {
        const {app} = this;
        const {nspName} = app.options;

        const js = this.toJS();

        try {
            const fn = Function(nspName, `return ${js}`) as (app: NSP.App) => NSP.NodeFn<T>;
            return fn(app);
        } catch (e) {
            app.log("JspParser: " + js?.substring(0, 1000));
            throw e;
        }
    }
}

const nameRE = `[A-Za-z][A-Za-z0-9]*`;
const stringRE = `"(?:\\\\[.]|[^\\\\"])*"|'(?:\\\\[.]|[^\\\\'])*'`;
const insideRE = `[^"']|${stringRE}`;
const tagRegExp = new RegExp(`(</?${nameRE}:(?:${insideRE})*?>)|(<%(?:${insideRE})*?%>)`, "s");

export const jspToJS = (app: NSP.App, src: string, option: NSP.ToJSOption): string => {
    const root = new Tag(app);
    const tree = new Store<Tag>(root);
    const array = src.split(tagRegExp);

    for (let i = 0; i < array.length; i++) {
        const i3 = i % 3;
        let str = array[i];

        if (i3 === 1 && str) {
            // taglib
            const tag = new Tag(app, str);

            // close-tag
            if (tag.isClose()) {
                const closed = tree.close();
                if (!closed) {
                    throw new Error(`invalid closing tag: </${tag.tagName}>`);
                }

                if (closed.tagName !== tag.tagName) {
                    throw new Error(`invalid closing tag: <${closed.tagName}></${tag.tagName}>`);
                }
                continue;
            }

            tree.get().append(tag);

            // open-tag
            if (tag.isOpen()) {
                tree.open(tag);
            }
        } else if (i3 === 2 && str) {

            // <% scriptlet %>
            const item = new Scriptlet(app, str);
            tree.get().append(item);

        } else if (i3 === 0) {
            // text node
            tree.get().append(str);
        }
    }

    const closed = tree.close();
    if (closed !== root) {
        throw new Error(`invalid closing tag: </${closed?.tagName}>`);
    }

    return root.toJS(option);
};

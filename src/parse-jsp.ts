import type {NSP} from "../index.js"

import {parseText} from "./parse-text.js";
import {parseAttr} from "./parse-attr.js";
import {parseScriptlet} from "./parse-scriptlet.js";
import {StackStore} from "./stack-store.js";

const emptyText: { [str: string]: boolean } = {
    '""': true,
    "''": true,
    "``": true,
    "null": true,
    "undefined": true,
    "": true,
};

type ChildNode = { toJS: (option?: NSP.ToJSOption) => string };

const isElement = (node: any): node is  ChildNode => ("function" === typeof node?.toJS);

const LF = (indent: number) => (+indent ? "\n" + " ".repeat(indent) : "\n");

/**
 * Parser for JSP document
 */
export const parseJSP = (app: NSP.App, src: string): NSP.Parser => new JspParser(app, src);

/**
 * Root element or an taglib element
 */
class Element {
    protected children: (string | ChildNode)[] = [];

    constructor(protected app: NSP.App, public tagName?: string, protected tagLine?: string) {
        //
    }

    append(node: string | ChildNode): void {
        this.children.push(node);
    }

    /**
     * Transpile JSP document to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption): string {
        const {app, tagLine} = this;
        const {comment, nspName, trimSpaces, vName} = app.options;

        const indent = +app.options.indent || 0;
        const currentIndent = +option?.currentIndent || 0;
        const nextIndent = currentIndent + indent;
        const currentLF = LF(currentIndent);
        const nextLF = LF(nextIndent);

        const {children} = this;

        const args = children.map(item => {
            if (isElement(item)) {
                return item.toJS({currentIndent: nextIndent});
            } else if (!/\S/.test(item)) {
                // item with only whitespace
                return (trimSpaces !== false) ? '""' : JSON.stringify(item);
            } else {
                if (trimSpaces !== false) {
                    item = item.replace(/^\s*[\r\n]/s, "\n");
                    item = item.replace(/\s*[\r\n]\s*$/s, "\n");
                    item = item.replace(/^[ \t]+/s, " ");
                    item = item.replace(/[ \t]+$/s, " ");
                }

                let js = parseText(app, item).toJS({currentIndent: nextIndent});
                if (/\(.+?\)|\$\{.+?}/s.test(js)) {
                    js = `${vName} => ${js}`; // array function
                }
                return js;
            }
        }).filter(v => !emptyText[v]);

        const hasBody = !!children.length;

        // keep at least single empty string if all arguments are empty strings
        if (hasBody && !args.length) {
            args.push('""');
        }

        const {tagName} = this;
        const isRoot = !tagName;

        const last = args.length - 1;
        args.forEach((v, idx) => {
            const isComment = /^\/\/[^\n]*$/s.test(v);

            if (idx !== last && !isComment) {
                args[idx] += ","
            } else if (idx === last && isComment) {
                args[idx] += currentLF;
            }
        });

        let body = args.join(nextLF);
        const bodyL = /^`\n/s.test(body) ? (isRoot ? "" : " ") : nextLF;
        const bodyR = /(\n`|[)\s])$/s.test(body) ? "" : currentLF;

        if (isRoot) {
            return `${nspName}.bundle(${bodyL}${body}${bodyR})`; // root element
        }

        // attributes as the second argument
        let attr = parseAttr(app, tagLine).toJS({currentIndent: args.length ? nextIndent : currentIndent});
        if (/\(.+?\)|\$\{.+?}/s.test(attr)) {
            attr = `${vName} => (${attr})`; // array function
        }

        const commentV = comment ? `// ${tagLine?.replace(/\s*[\r\n]\s*/g, " ") ?? ""}${currentLF}` : "";
        const nameV = JSON.stringify(tagName);
        const hasAttr = /:/.test(attr);
        const attrV = (hasBody || hasAttr) ? `, ${attr}` : "";
        const bodyV = hasBody ? `,${bodyL}${body}${bodyR}` : "";

        return `${commentV}${nspName}.tag(${nameV}${attrV}${bodyV})`;
    }
}

class JspParser implements NSP.Parser {
    constructor(protected app: NSP.App, protected src: string) {
        //
    }

    /**
     * Transpile JSP document to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption) {
        const {app, src} = this;
        return jspToJS(app, src, option);
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
    const root = new Element(app);
    const tree = new StackStore<Element>(root);
    const array = src.split(tagRegExp);

    for (let i = 0; i < array.length; i++) {
        const i3 = i % 3;
        let str = array[i];

        if (i3 === 1 && str) {
            // taglib
            const tagName = str.match(/^<\/?([^\s=/>]+)/)?.[1];

            // close-tag
            if (/^<\//.test(str)) {
                const closed = tree.close();
                if (!closed) {
                    throw new Error(`invalid closing tag: </${tagName}>`);
                }

                if (closed.tagName !== tagName) {
                    throw new Error(`invalid closing tag: <${closed.tagName}></${tagName}>`);
                }
                continue;
            }

            const element = new Element(app, tagName, str);
            tree.get().append(element);

            // open-tag
            if (!/\/\s*>$/.test(str)) {
                tree.open(element);
            }
        } else if (i3 === 2 && str) {

            // <% scriptlet %>
            const item = parseScriptlet(app, str);
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

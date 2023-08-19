import type {NSP} from "../index.js"

import {parseText} from "./parse-text.js";
import {parseAttr} from "./parse-attr.js";
import {parseScriptlet} from "./parse-scriptlet.js";

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
        const {comment, nspKey, vKey} = app.options;

        const indent = +app.options.indent || 0;
        const currentIndent = +option?.indent || 0;
        const nextIndent = currentIndent + indent;
        const currentLF = currentIndent ? "\n" + " ".repeat(currentIndent) : "\n";
        const nextLF = nextIndent ? "\n" + " ".repeat(nextIndent) : "\n";

        const {children} = this;

        const args = children.map(item => {
            if (isElement(item)) {
                return item.toJS({indent: nextIndent});
            } else if (!/\S/.test(item)) {
                // item with only whitespace
                return '""';
            } else {
                let js = parseText(app, item).toJS({indent: nextIndent});
                if (/\(.+?\)|\$\{.+?}/s.test(js)) {
                    js = `${vKey} => ${js}`; // array function
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
            return `${nspKey}.bundle(${bodyL}${body}${bodyR})`; // root element
        }

        // attributes as the second argument
        let attr = parseAttr(app, tagLine).toJS({indent: args.length ? nextIndent : currentIndent});
        if (/\(.+?\)|\$\{.+?}/s.test(attr)) {
            attr = `${vKey} => (${attr})`; // array function
        }

        const commentV = comment ? `// ${tagLine?.replace(/\s*[\r\n]\s*/g, " ") ?? ""}${currentLF}` : "";
        const nameV = JSON.stringify(tagName);
        const hasAttr = /:/.test(attr);
        const attrV = (hasBody || hasAttr) ? `, ${attr}` : "";
        const bodyV = hasBody ? `,${bodyL}${body}${bodyR}` : "";

        return `${commentV}${nspKey}.tag(${nameV}${attrV}${bodyV})`;
    }
}

/**
 * Tree of elements
 */
class Tree {
    protected tree: Element[] = [];

    constructor(protected root: Element) {
        this.tree.push(root);
    }

    append(node: string | ChildNode): void {
        this.tree.at(0).append(node);
    }

    open(node: Element): void {
        this.append(node);
        this.tree.unshift(node);
    }

    close(tagName: string): void {
        const openTag = this.getTagName();
        if (openTag !== tagName) {
            throw new Error(`mismatch closing tag: ${openTag} !== ${tagName}`);
        }

        this.tree.shift();
    }

    getTagName(): string {
        return this.tree.at(0).tagName;
    }

    isRoot(): boolean {
        return this.tree.length === 1;
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
        const {nspKey} = app.options;

        const js = this.toJS();

        try {
            const fn = Function(nspKey, `return ${js}`) as (app: NSP.App) => NSP.NodeFn<T>;
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
    const tree = new Tree(root);
    const {trimSpaces} = app.options;

    const array = src.split(tagRegExp);

    for (let i = 0; i < array.length; i++) {
        const i3 = i % 3;
        let str = array[i];

        if (i3 === 1 && str) {
            // taglib
            const tagName = str.match(/^<\/?([^\s=/>]+)/)?.[1];
            if (/^<\//.test(str)) {
                tree.close(tagName);
                continue;
            }

            const element = new Element(app, tagName, str);
            if (/\/\s*>$/.test(str)) {
                tree.append(element);
            } else {
                tree.open(element);
            }
        } else if (i3 === 2 && str) {

            // <% scriptlet %>
            const item = parseScriptlet(app, str);
            tree.append(item);

        } else if (i3 === 0) {
            // text node
            if (trimSpaces !== false) {
                str = str.replace(/^\s*[\r\n]/s, "\n");
                str = str.replace(/\s*[\r\n]\s*$/s, "\n");

                str = str.replace(/^[ \t]+/s, " ");
                str = str.replace(/[ \t]+$/s, " ");
            }

            tree.append(str);
        }
    }

    if (!tree.isRoot()) {
        throw new Error("missing closing tag: " + tree.getTagName());
    }

    return root.toJS(option);
};

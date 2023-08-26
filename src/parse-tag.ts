import type {NSP} from "../index.js";

import {parseText} from "./parse-text.js";
import {parseAttr} from "./parse-attr.js";

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
 * Root node or an taglib node
 */
export class TagParser {
    public tagName: string;

    protected children: (string | ChildNode)[] = [];

    constructor(protected app: NSP.App, protected src?: string) {
        this.tagName = src?.match(/^<\/?([^\s=/>]+)/)?.[1];
    }

    append(node: string | ChildNode): void {
        this.children.push(node);
    }

    isOpen(): boolean {
        return !/\/\s*>$/.test(this.src);
    }

    isClose(): boolean {
        return /^<\//.test(this.src);
    }

    /**
     * Transpile JSP document to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption): string {
        const {app, src} = this;
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
        let attr = parseAttr(app, src).toJS({currentIndent: args.length ? nextIndent : currentIndent});
        if (/\(.+?\)|\$\{.+?}/s.test(attr)) {
            attr = `${vName} => (${attr})`; // array function
        }

        const commentV = comment ? `// ${src?.replace(/\s*[\r\n]\s*/g, " ") ?? ""}${currentLF}` : "";
        const nameV = JSON.stringify(tagName);
        const hasAttr = /:/.test(attr);
        const attrV = (hasBody || hasAttr) ? `, ${attr}` : "";
        const bodyV = hasBody ? `,${bodyL}${body}${bodyR}` : "";

        return `${commentV}${nspName}.tag(${nameV}${attrV}${bodyV})`;
    }
}

import type {NSP} from "../../index.js";

import {Text} from "./text.js";
import {Attr} from "./attr.js";

const emptyText: { [str: string]: boolean } = {
    '""': true,
    "''": true,
    "``": true,
    "null": true,
    "undefined": true,
    "": true,
};

const isTranspiler = (v: any): v is NSP.Transpiler => ("function" === typeof v?.toJS);

const LF = (indent: number) => (+indent ? "\n" + " ".repeat(indent) : "\n");

/**
 * Root node or an taglib node
 */
export class Tag implements NSP.Transpiler {
    public tagName: string;

    protected children: (string | NSP.Transpiler)[] = [];

    constructor(protected app: NSP.App, protected src?: string) {
        this.tagName = src?.match(/^<\/?([^\s=/>]+)/)?.[1];
    }

    append(node: string | NSP.Transpiler): void {
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
        const {app, tagName} = this;
        const {nspName, trimSpaces, vName} = app.options;

        const indent = +app.options.indent || 0;
        const currentIndent = +option?.currentIndent || 0;
        const nextIndent = currentIndent + indent;
        const currentLF = LF(currentIndent);
        const nextLF = LF(nextIndent);

        const {children} = this;

        const args = children.map(item => {
            if (isTranspiler(item)) {
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

                let js = new Text(app, item).toJS({currentIndent: nextIndent});
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

        const bodyL = /^`\n/s.test(args.at(0)) ? "" : nextLF;
        const bodyR = /(\n`|[)\s])$/s.test(args.at(-1)) ? "" : currentLF;
        const body = hasBody ? (bodyL + args.join(nextLF) + bodyR) : "";

        if (isRoot) {
            return `${nspName}.bundle(${body})`; // root element
        }

        // TODO
        return this._toJS(option, body);
    }

    private _toJS(option: NSP.ToJSOption, body: string): string {
        const {app, src, tagName} = this;
        const {comment, nspName, vName} = app.options;

        const indent = +app.options.indent || 0;
        const currentIndent = +option?.currentIndent || 0;
        const nextIndent = currentIndent + indent;

        // attributes as the second argument
        let attr = new Attr(app, src).toJS({currentIndent: (body ? nextIndent : currentIndent)});
        if (/\(.+?\)|\$\{.+?}/s.test(attr)) {
            attr = `${vName} => (${attr})`; // array function
        }

        const commentV = comment ? `// ${src?.replace(/\s*[\r\n]\s*/g, " ") ?? ""}${LF(currentIndent)}` : "";
        const nameV = JSON.stringify(tagName);
        const hasAttr = /:/.test(attr);
        const restV = (body ? (`, ${attr}, ${body}`) : (hasAttr ? `, ${attr}` : "");

        return `${commentV}${nspName}.tag(${nameV}${restV})`;
    }
}

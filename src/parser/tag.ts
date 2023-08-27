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

    private getBodyJS(option: NSP.ToJSOption): string {
        const {app} = this;
        const {indent, trimSpaces, vName} = app.options;

        const spaces = +indent ? " ".repeat(+indent) : (indent ?? "");
        const currentLF = option?.LF ?? "\n";
        const nextLF = currentLF + spaces;

        const {children} = this;

        const args = children.map(item => {
            if (isTranspiler(item)) {
                return item.toJS({LF: nextLF});
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

                let js = new Text(app, item).toJS({LF: nextLF});
                if (/\(.+?\)|\$\{.+?}/s.test(js)) {
                    js = `${vName} => ${js}`; // array function
                }
                return js;
            }
        }).filter(v => !emptyText[v]);

        // empty body
        if (!children.length) {
            return "";
        }

        // keep a single empty string at least if all arguments are trimmed
        if (!args.length) {
            args.push('""');
        }

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

        return bodyL + args.join(nextLF) + bodyR;
    }

    /**
     * Transpile JSP document to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption): string {
        const {app, tagName} = this;
        const {nspName} = app.options;

        if (this.isClose()) return; // invalid

        if (tagName) {
            const commentJS = this.getCommentJS(option);
            const tagJS = this.getTagJS(option); // tag element
            return commentJS ? commentJS + tagJS : tagJS;
        } else {
            const bodyJS = this.getBodyJS(option);
            return `${nspName}.bundle(${bodyJS})`; // root element
        }
    }

    private getCommentJS(option: NSP.ToJSOption): string {
        const {app, src} = this;
        if (!app.options.comment) return;

        const currentLF = option?.LF ?? "\n";
        return `// ${src?.replace(/\s*[\r\n]\s*/g, " ") ?? ""}${currentLF}`;
    }

    private getTagJS(option: NSP.ToJSOption): string {
        const {app, src, tagName} = this;
        const {indent, nspName, vName} = app.options;

        const spaces = +indent ? " ".repeat(+indent) : (indent ?? "");
        const currentLF = option?.LF ?? "\n";
        const nextLF = currentLF + spaces;

        const bodyJS = this.getBodyJS(option);

        const attr = new Attr(app, src).toJS({LF: (bodyJS ? nextLF : currentLF)});

        // transpile attributes to array function if they include variables
        const hasVars = /\(.+?\)|\$\{.+?}/s.test(attr);
        const attrJS = hasVars ? `${vName} => (${attr})` : attr;

        const nameJS = JSON.stringify(tagName);
        const hasAttr = /:/.test(attr);
        const restJS = bodyJS ? (`, ${attrJS}, ${bodyJS}`) : (hasAttr ? `, ${attrJS}` : "");

        return `${nspName}.tag(${nameJS}${restJS})`;
    }
}

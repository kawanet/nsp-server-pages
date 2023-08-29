import type {NSP} from "../../index.js";
import {Attr} from "./attr.js";

import {Text} from "./text.js";

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

        const SP = option?.SP ?? (("string" === typeof indent) ? indent : (+indent ? " ".repeat(+indent) : ""));
        const LF = option?.LF ?? "\n";
        const nextLF = LF + SP;
        const nextOption = {SP, LF: nextLF};

        const {children} = this;

        const args = children.map(item => {
            if (isTranspiler(item)) {
                return item.toJS(nextOption);
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

                let js = new Text(app, item).toJS(nextOption);
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
                args[idx] += LF;
            }
        });

        const bodyL = /^`\n/s.test(args.at(0)) ? "" : nextLF;

        const bodyR = /(\n`|[)\s])$/s.test(args.at(-1)) ? "" : LF;

        return bodyL + args.join(nextLF) + bodyR;
    }

    /**
     * Transpile JSP document to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption): string {
        const {app, tagName} = this;
        const {indent, nspName} = app.options;

        // root element
        if (!tagName) {
            const bodyJS = this.getBodyJS(option);
            return `${nspName}.bundle(${bodyJS})`; // root element
        }

        if (this.isClose()) return; // invalid

        const commentJS = this.getCommentJS(option);

        const attr = new Attr(app, this.src);

        const body = this.getBodyJS(option);

        const SP = option?.SP ?? (("string" === typeof indent) ? indent : (+indent ? " ".repeat(+indent) : ""));
        const LF = option?.LF ?? "\n";
        const nextLF = LF + SP;
        const nextOption = {SP, LF: (body ? nextLF : LF)};

        const type = `parse.tag.${tagName}`;
        const def: NSP.TagParserDef<any> = {app, name: tagName, attr, body, LF: LF, nextLF};

        const tagJS = app.process<string>(type, def) ?? this.getTagJS(def, nextOption);

        return commentJS ? commentJS + tagJS : tagJS;
    }

    private getCommentJS(option: NSP.ToJSOption): string {
        const {app, src} = this;
        if (!app.options.comment) return;

        const currentLF = option?.LF ?? "\n";
        return `// ${src?.replace(/\s*[\r\n]\s*/g, " ") ?? ""}${currentLF}`;
    }

    private getTagJS(def: NSP.TagParserDef<any>, option: NSP.ToJSOption): string {
        const {app, tagName} = this;
        const {nspName, vName} = app.options;

        const attrRaw = def.attr.toJS(option);

        // transpile attributes to array function if they include variables
        const hasVars = /\(.+?\)|\$\{.+?}/s.test(attrRaw);
        const attrArg = hasVars ? `, ${vName} => (${attrRaw})` : `, ${attrRaw}`;

        const nameJS = JSON.stringify(tagName);
        const hasAttr = /:/.test(attrRaw);

        let bodyArg = def.body;
        if (bodyArg) bodyArg = ((/^\n/.test(bodyArg)) ? "," : ", ") + bodyArg;

        const restJS = bodyArg ? (attrArg + bodyArg) : (hasAttr ? attrArg : "");

        return `${nspName}.tag(${nameJS}${restJS})`;
    }
}

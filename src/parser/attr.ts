import type {NSP} from "../../index.js";

import {Text} from "./text.js";

const isSafeKey = (key: string) => /^[A-Za-z_]\w+$/.test(key);

/**
 * Parser for HTML tag attributes <tagName attr="value"/>
 */
export class Attr implements NSP.AttrParser<any> {
    protected src: string;
    private index: { [key: string]: string };

    constructor(protected app: NSP.App, src: string) {
        this.src = app.process<string>("before.parse.attr", src) ?? src;
    }

    /**
     * Transpile HTML tag attributes to JavaScript source code
     */
    toJS(option: NSP.ToJSOption): string {
        const {app, src} = this;
        const js = app.process<string>("parse.attr", src) ?? this._toJS(option);
        return app.process<string>("after.parse.attr", js) ?? js;
    }

    keys(): string[] {
        return Object.keys(this.getIndex());
    }

    get(key: string): string {
        return this.getIndex()[key];
    }

    protected getIndex(): { [key: string]: string } {
        let {index, src} = this;
        if (index) return index;

        index = this.index = {};
        if (!src) return index;

        src = src.replace(/^\s*<\S+\s*/s, "");
        src = src.replace(/\s*\/?>\s*$/s, "");

        src.replace(/([^\s='"]+)(\s*=(?:\s*"([^"]*)"|\s*'([^']*)'|([^\s='"]*)))?/g, (_: string, key: string, eq: string, v1: string, v2: string, v3: string) => {
            if (eq) {
                const value = unescapeXML(v1 || v2 || v3 || "");
                index[key] = new Text(this.app, value).toJS({});
            } else {
                const value = true;
                index[key] = String(value);
            }

            return "";
        });

        return index;
    }

    /**
     * Transpile HTML tag attributes to JavaScript source code
     */
    private _toJS(option: NSP.ToJSOption): string {
        const {app} = this;
        const {indent} = app.options;
        const spaces = +indent ? " ".repeat(+indent) : (indent ?? "");
        const currentLF = option?.LF ?? "\n";
        const nextLF = currentLF + spaces;

        const keys = this.keys();
        const items: string[] = keys.map(key => {
            if (!isSafeKey(key)) {
                key = JSON.stringify(key);
            }

            const value = this.get(key);
            return `${key}: ${value}`;
        });

        // no arguments
        if (!keys.length) return 'null';

        const js = items.join(`,${nextLF}`);
        const trailingComma = (keys.length > 1) ? "," : "";
        return `{${nextLF}${js}${trailingComma}${currentLF}}`;
    }
}

const UNESCAPE: { [str: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&quot;": '"'
};

const unescapeXML = (str: string): string => {
    return str?.replace(/(&(?:lt|gt|amp|apos|quot|#(?:\d{1,6}|x[0-9a-fA-F]{1,5}));)/g, (str) => {
        if (str[1] === "#") {
            const code = (str[2] === "x") ? parseInt(str.substring(3), 16) : parseInt(str.substr(2), 10);
            if (code > -1) return String.fromCharCode(code);
        }
        return UNESCAPE[str] || str;
    });
};

import type {NSP} from "../../index.js";

import {Text} from "./text.js";

/**
 * Parser for HTML tag attributes <tagName attr="value"/>
 */
export class Attr implements NSP.Transpiler {
    protected src: string;

    constructor(protected app: NSP.App, src: string) {
        this.src = app.process<string>("before.parse.attr", src) ?? src;
    }

    /**
     * Transpile HTML tag attributes to JavaScript source code
     */
    toJS(option: NSP.ToJSOption): string {
        const {app, src} = this;
        const js = app.process<string>("parse.attr", src) ?? attrToJS(app, src, option);
        return app.process<string>("after.parse.attr", js) ?? js;
    }
}

/**
 * Transpile HTML tag attributes to JavaScript source code
 */
const attrToJS = (app: NSP.App, tag: string, option: NSP.ToJSOption): string => {
    tag = tag?.replace(/^\s*<\S+\s*/s, "");
    tag = tag?.replace(/\s*\/?>\s*$/s, "");

    const {indent} = app.options;
    const spaces = +indent ? " ".repeat(+indent) : (indent ?? "");
    const currentLF = option?.LF ?? "\n";
    const nextLF = currentLF + spaces;

    const keys: string[] = [];
    const index: { [key: string]: string | boolean } = {};

    tag?.replace(/([^\s='"]+)(\s*=(?:\s*"([^"]*)"|\s*'([^']*)'|([^\s='"]*)))?/g, (_: string, key: string, eq: string, v1: string, v2: string, v3: string) => {
        if (!index[key]) keys.push(key);
        index[key] = (eq ? unescapeXML(v1 || v2 || v3 || "") : true);
        return "";
    });

    const items: string[] = keys.map(key => {
        let value = index[key];

        if (!/^[A-Za-z_]\w+$/.test(key)) {
            key = JSON.stringify(key);
        }

        if ("string" === typeof value) {
            value = new Text(app, value).toJS({LF: nextLF});
        }

        return `${key}: ${value}`;
    });

    // no arguments
    if (!keys.length) return 'null';

    const js = items.join(`,${nextLF}`);
    const trailingComma = (keys.length > 1) ? "," : "";
    return `{${nextLF}${js}${trailingComma}${currentLF}}`;
};

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

import {parseText} from "./parse-text.js";

/**
 * Parser for HTML tag attributes <tagName attr="value"/>
 */
export const parseAttr = (app: NSP.App, src: string) => new AttrParser(app, src);

class AttrParser {
    constructor(protected app: NSP.App, protected src: string) {
        //
    }

    /**
     * Transpile HTML tag attributes to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption): string {
        return attrToJS(this.app, this.src, option);
    }

    /**
     * Compile HTML tag attributes to JavaScript function instance
     */
    toFn<A, T = any>(): NSP.AttrFn<A, T> {
        const {app} = this;
        const {nspKey, vKey} = app.options;

        const js = this.toJS();

        try {
            const fn = Function(nspKey, vKey, `return ${js}`) as (app: NSP.App, v: T) => A;
            return (context?: T) => fn(app, context);
        } catch (e) {
            app.log("AttrParser: " + js.substring(0, 1000));
            throw e;
        }
    }
}

/**
 * Transpile HTML tag attributes to JavaScript source code
 */
const attrToJS = (app: NSP.App, tag: string, option: NSP.ToJSOption): string => {
    tag = tag?.replace(/^\s*<\S+\s*/s, "");
    tag = tag?.replace(/\s*\/?>\s*$/s, "");

    const indent = +app.options.indent || 0;
    const currentIndent = +option?.indent || 0;
    const nextIndent = currentIndent + indent;
    const currentLF = currentIndent ? "\n" + " ".repeat(currentIndent) : "\n";
    const nextLF = nextIndent ? "\n" + " ".repeat(nextIndent) : "\n";

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
            value = parseText(app, value).toJS({indent: nextIndent});
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
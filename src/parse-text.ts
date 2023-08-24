import type {NSP} from "../index.js"

import {parseEL} from "./parse-el.js";
import {parseScriptlet} from "./parse-scriptlet.js";

/**
 * escape special characters in Template Literal
 */
const escapeTL = (str: string): string => str.replace(/([\\`$])/g, "\\$1");

const TLStringify = (str: string): string => ("`" + escapeTL(str) + "`");

const stringify = (str: string): string => (/[\r\n"<>]/.test(str) ? TLStringify(str) : JSON.stringify(str));

/**
 * Regular expression to match ${expression} in text
 */
const stringRE = `"(?:\\\\[.]|[^\\\\"])*"|'(?:\\\\[.]|[^\\\\'])*'`;
const insideRE = `[^"']|${stringRE}`;
const bodyRE = `([$#][{](?:${insideRE})*?})|(<%=(?:${insideRE})*?%>)`;
const bodyRegExp = new RegExp(bodyRE, "s");

/**
 * Parser for: text content
 */
export const parseText = (app: NSP.App, src: string) => new TextParser(app, src);

class TextParser {
    constructor(protected app: NSP.App, protected src: string) {
        //
    }

    /**
     * Transpile ${expression} and <% scriptlet %> to JavaScript source code
     */
    toJS(option?: NSP.ToJSOption) {
        return textToJS(this.app, this.src, option);
    }

    /**
     * Compile ${expression} and <% scriptlet %> to JavaScript function instance
     */
    toFn<T>() {
        const {app} = this;
        const {nspName, vName} = app.options;

        const js = this.toJS();

        try {
            const fn = Function(nspName, vName, `return ${js}`) as (app: NSP.App, v: T) => string | Promise<string>;
            return (context?: T) => fn(app, context);
        } catch (e) {
            app.log("TextParser: " + js?.substring(0, 1000));
            throw e;
        }
    }
}

/**
 * Transpile ${expression}, #{async expression} and <% scriptlet %> to JavaScript source code
 */
const textToJS = (app: NSP.App, src: string, option: NSP.ToJSOption): string => {
    const array = src.split(bodyRegExp);

    const items: (string | { toJS: (option?: NSP.ToJSOption) => string })[] = [];

    for (let i = 0; i < array.length; i++) {
        const i3 = i % 3;
        let value = array[i];

        if (!value) continue;

        if (i3 === 1) {

            // ${expression}, #{async expression}
            const isAsync = /^#/s.test(value);
            value = value.replace(/^[$#]\{\s*/s, "");
            value = value.replace(/\s*}$/s, "");

            const item = parseEL(app, value);
            if (isAsync) {
                items.push({toJS: (option) => `await ${item.toJS(option)}`});
            } else {
                items.push(item);
            }

        } else if (i3 === 2) {

            // <% scriptlet %>
            const item = parseScriptlet(app, value);
            items.push(item);

        } else {

            // text literal
            items.push(value);
        }
    }

    // empty string
    if (!items.length) return '""';

    // single element
    if (items.length === 1) {
        const item = items[0];
        if (typeof item === "string") {
            return stringify(item);
        } else {
            return "(" + item.toJS(option) + ")";
        }
    }

    let hasAwait = false;
    items.forEach((item, i) => {
        if (typeof item === "string") {
            items[i] = escapeTL(item);
        } else {
            const js = item.toJS(option);
            if (/^\(?await\s/.test(js)) hasAwait = true;
            items[i] = "${" + js + "}";
        }
    });

    let out = "`" + items.join("") + "`";

    // wrap in async function if it has an await
    if (hasAwait) {
        out = `(async () => (${out}))()`;
    }

    return out;
};

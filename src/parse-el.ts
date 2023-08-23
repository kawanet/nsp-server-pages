import type {NSP} from "../index.js"

const trim = (str: string) => str.replace(/^\s+/s, "").replace(/\s+$/s, "");

const wordMap: { [str: string]: string } = {
    and: "&&",
    div: "/",
    empty: "!",
    eq: "==",
    false: "false",
    ge: ">=",
    gt: ">",
    instanceof: "instanceof",
    le: "<=",
    lt: "<",
    mod: "%",
    ne: "!=",
    not: "!",
    null: "null",
    or: "||",
    true: "true",
};

const numericRE = `[0-9]+(?![0-9])`;
const floatRE = `${numericRE}(?:\\.${numericRE})?(?!\\.)`;
const stringRE = `"(?:\\\\\\.|[^\\\\"])*"|'(?:\\\\\\.|[^\\\\'])*'`;
const nameRE = `[A-Za-z_][A-Za-z_0-9]*(?![A-Za-z_0-9])`;
const tagFnRE = `${nameRE}:${nameRE}\\(`;
const variableRE = `${nameRE}(?:\\??\\.${nameRE}|(?:\\?\\.)?\\[(?:${numericRE}|${stringRE})\\]|\\[)*`;
const itemRE = [tagFnRE, variableRE, floatRE, stringRE].join("|");

const tagFnRegExp = new RegExp(`^${tagFnRE}$`, "s");
const variableRegExp = new RegExp(`^${variableRE}$`, "s");
const itemRegExp = new RegExp(`(${itemRE})`, "s");

/**
 * Simplified transformer for expression language
 */
export const parseEL = (app: NSP.App, src: string) => new ElParser(app, src);

class ElParser {
    constructor(protected app: NSP.App, protected src: string) {
        //
    }

    /**
     * Compile ${EL} to JavaScript function instance
     */
    toFn<T>() {
        const {app} = this;
        const {nspName, vName} = app.options;

        const js = this.toJS();

        try {
            const fn = Function(nspName, vName, `return ${js}`) as (app: NSP.App, v: T) => string;
            return (context?: T) => fn(app, context);
        } catch (e) {
            app.log("ElParser: " + js?.substring(0, 1000));
            throw e;
        }
    }

    /**
     * Transpile ${EL} to JavaScript source code
     */
    toJS(_?: NSP.ToJSOption) {
        const {app} = this;
        const {nullish, prefilter, postfilter} = app.options;

        let src = trim(this.src);
        if (prefilter) src = prefilter(src);
        if (src == null) return 'null';

        const array = src.split(itemRegExp);
        const {nspName, vName} = app.options;

        for (let i = 0; i < array.length; i++) {
            let exp = array[i];

            if (i & 1) {
                if (wordMap[exp]) {
                    // eq, and, or
                    array[i] = wordMap[exp];
                } else if (tagFnRegExp.test(exp)) {
                    // taglib function
                    exp = exp.replace(/\($/, "");
                    array[i] = `${nspName}.fn(${JSON.stringify(exp)})(`;
                } else if (variableRegExp.test(exp)) {
                    // variable
                    exp = exp.replace(/(\?)?\./g, "?.");
                    exp = exp.replace(/(\?\.)?\[/g, "?.[");
                    exp = exp.replace(/\s+$/, "");
                    array[i] = `${vName}.${exp}`;
                }
            } else {
                // less spaces
                array[i] = exp.replace(/\s+/sg, " ");
            }
        }

        let js = array.join("");

        if (!nullish) {
            if (array.filter(v => /\S/.test(v)).length > 1) {
                js = `(${js})`;
            }
            js = `${js} ?? ""`;
        }

        if (postfilter) js = postfilter(js);

        return js;
    }
}
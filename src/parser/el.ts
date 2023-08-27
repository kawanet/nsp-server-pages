import type {NSP} from "../../index.js";

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
export class EL implements NSP.Transpiler {
    protected src: string;

    constructor(protected app: NSP.App, src: string) {
        src = trim(src);
        this.src = app.process<string>("before.parse.el", src) ?? src;
    }

    /**
     * Transpile ${EL} to JavaScript source code
     */
    toJS(option: NSP.ToJSOption) {
        const {app, src} = this;
        const js = app.process<string>("parse.el", src) ?? this._toJS(option);
        return app.process<string>("after.parse.el", js) ?? js;
    }

    private _toJS(_: NSP.ToJSOption) {
        const {app, src} = this;
        const {nullish} = app.options;

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

        return js;
    }
}
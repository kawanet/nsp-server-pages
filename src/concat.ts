import type {NSP} from "../index.js"

const isPromise = <T>(v: any): v is Promise<T> => v && (typeof v.then === "function");

const join = (a: string, b: string): string => (a == null ? b : (b == null ? a : a + b));

const single = (v: NSP.TextFlex): string | Promise<string> => (Array.isArray(v) ? concat(v) : v);

export const concat = (array: ArrayLike<NSP.TextFlex>): string | Promise<string> => {
    let result: string;
    let promise: Promise<string>;

    for (let i = 0; i < array.length; i++) {
        let text: string | Promise<string> = single(array[i]);

        if (promise) {
            promise = promise.then(result => {
                if (isPromise<string>(text)) {
                    return text.then(text => join(result, text));
                } else {
                    return join(result, text);
                }
            });
        } else {
            if (isPromise<string>(text)) {
                // upgrade to async mode
                promise = text.then(text => join(result, text));
            } else {
                // sync mode per default
                result = join(result, text);
            }
        }
    }

    return promise || result;
}

import type {NSP} from "../index.js"
import {concat} from "./concat.js";

export const bundle = <T>(array: ArrayLike<NSP.Node<T>>, start?: number, end?: number): NSP.NodeFn<T> => {
    start = +start || 0;
    end = +end || array?.length || 0;

    // empty
    if (end <= start) {
        return () => null;
    }

    // single item
    if (end - 1 === start) {
        const node = array[start];
        return (typeof node === "function") ? node : () => node;
    }

    // multiple items
    return context => {
        let results: (string | Promise<string>)[] = [];

        for (let i = start; i < end; i++) {
            const item: string | NSP.NodeFn<T> = array[i];

            if (typeof item === "function") {
                results.push(item(context));
            } else {
                results.push(item);
            }
        }

        return concat(results);
    };
};

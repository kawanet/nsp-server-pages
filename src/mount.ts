import type {NSP} from "../index.js";
import type {App} from "./app.js";

export function mount(this: App, match: RegExp | string, fn: NSP.LoaderFn): void {
    const test: { test: (path: string) => boolean } = ("string" !== typeof match) ? match : {
        test: ((path: string) => path.startsWith(match))
    };

    this.loaders.push(!test ? fn : path => {
        if (test.test(path)) return fn(path);
    });
}

export async function load<T = any>(this: App, path: string): Promise<NSP.NodeFn<T>> {
    const {loaders} = this;

    const search = path.replace(/^[^?]*\??/, "");

    path = path.replace(/\?.*$/, "");
    path = path.replace(/^\/*/, "/");

    let fn: NSP.NodeFn<T>;

    for (const loaderFn of loaders) {
        fn = await loaderFn(path);
        if (fn) break;
    }

    if (!fn) throw new Error(`file not found: ${path}`);

    return context => {
        for (const [key, value] of new URLSearchParams(search)) {
            (context as any)[key] = value;
        }

        return fn(context);
    };
}

export const mount = (app: NSP.App, match: RegExp | string, fn: NSP.LoaderFn): void => {
    const test: { test: (path: string) => boolean } = ("string" !== typeof match) ? match : {
        test: ((path: string) => path.startsWith(match))
    };

    app.loaders.push(!test ? fn : path => {
        if (test.test(path)) return fn(path);
    });
}

export const load = async <T = any>(app: NSP.App, path: string): Promise<NSP.NodeFn<T>> => {
    const {loaders} = app;

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
};

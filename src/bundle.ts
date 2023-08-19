const isPromise = (v: any): v is Promise<any> => v && (typeof v.then === "function");

const join = (a: string, b: string): string => (a == null ? b : (b == null ? a : a + b));

export const bundle = <T>(array: ArrayLike<NSP.Node<T>>, start?: number, end?: number): NSP.NodeFn<T> => {
    start = +start || 0;
    end = +end || array?.length || 0;

    if (end <= start) {
        return () => null;
    }

    if (end - 1 === start) {
        const node = array[start];
        return (typeof node === "function") ? node : () => node;
    }

    return context => {
        let result: string;
        let promise: Promise<string>;

        for (let i = start; i < end; i++) {
            let v: string | Promise<string> | NSP.NodeFn<T> = array[i];

            if (promise) {
                promise = promise.then(result => {
                    if (typeof v === "function") {
                        v = v(context);
                    }

                    if (isPromise(v)) {
                        return v.then(v => join(result, v));
                    } else {
                        return join(result, v);
                    }
                });
            } else {
                if (typeof v === "function") {
                    v = v(context);
                }

                if (isPromise(v)) {
                    // upgrade to async mode
                    promise = v.then(v => join(result, v));
                } else {
                    // sync mode per default
                    result = join(result, v);
                }
            }
        }

        return promise || result;
    };
};

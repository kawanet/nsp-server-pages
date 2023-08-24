import type {NSP} from "../index.js"

const isPromise = <T>(v: any): v is Promise<T> => v && (typeof v.catch === "function");

interface TagData {
    error?: Error;
}

export const catchFn = <T>(app: NSP.App, fn: NSP.NodeFn<T>): NSP.NodeFn<T> => {
    return context => {
        try {
            const result = fn(context);
            if (isPromise(result)) {
                return result.catch(errorHandler);
            } else {
                return result;
            }
        } catch (e) {
            return errorHandler(e);
        }

        function errorHandler(e: Error): string {
            // just throw the error if it's already handled
            if (context != null) {
                const data = app.store<TagData>(context, "error", () => ({}));
                if (data.error === e) throw e;
                data.error = e;
            }

            // call the error hook
            const result: string = app.process("error", e, context);

            // if the hook returns nothing, throw the error
            if (result == null) throw e;

            // if the hook returns a string, show it
            return result;
        }
    }
};

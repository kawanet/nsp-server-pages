import {toXML} from "to-xml";

import type {NSP} from "../index.js"

const isPromise = <T>(v: any): v is Promise<T> => v && (typeof v.catch === "function");

const escapeError = (e: Error): string => toXML({"#": (e?.message || String(e))});

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

            // call the error handler
            const result = app.process("error", e, context);
            if (result != null) return result as string;

            return `<!--\n[ERR] ${escapeError(e)}\n-->`;
        }
    }
};

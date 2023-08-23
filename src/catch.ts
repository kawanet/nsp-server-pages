import {toXML} from "to-xml";

import type {NSP} from "../index.js"

const isPromise = <T>(v: any): v is Promise<T> => v && (typeof v.catch === "function");

const escapeError = (e: Error): string => toXML({"#": (e?.message || String(e))});

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
            const result = app.process("error", e, context);
            if (result == null) {
                return `<!--\n[ERR] ${escapeError(e)}\n-->`;
            }
            return result as string;
        }
    }
};

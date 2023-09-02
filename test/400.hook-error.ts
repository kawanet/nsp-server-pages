import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "400.hook-error.ts";

describe(TITLE, () => {
    const nsp = createNSP();

    /**
     * This pass the error to the next handler when it's a SyntaxError but not other errors.
     */
    nsp.hook("error", (e) => {
        if (e instanceof SyntaxError) throw e;
        return `[${e?.message}]`;
    });

    nsp.addTagLib({
        ns: "test",
        fn: {
            NormalErrorFnSync: () => {
                // this should be caught
                throw new Error("NormalErrorFnSync");
            },
            SyntaxErrorFnSync: () => {
                // this should rise an exception
                throw new SyntaxError("SyntaxErrorFnSync");
            },
        },
        tag: {
            NormalErrorTagSync: () => {
                return () => {
                    // this should be caught
                    throw new Error("NormalErrorTagSync");
                };
            },
            SyntaxErrorTagSync: (_: NSP.TagDef<any>) => {
                return () => {
                    // this should rise an exception
                    throw new SyntaxError("SyntaxErrorTagSync");
                }
            },
            NormalErrorTagAsync: () => {
                return async () => {
                    // this should be caught
                    throw new Error("NormalErrorTagAsync");
                };
            },
            SyntaxErrorTagAsync: (_: NSP.TagDef<any>) => {
                return async () => {
                    // this should rise an exception
                    throw new SyntaxError("SyntaxErrorTagAsync");
                }
            },
        },
    });

    it("NormalErrorFnSync", async () => {
        assert.doesNotThrow(() => nsp.parse('${test:NormalErrorFnSync()}').toFn()({}));
    });

    it("SyntaxErrorFnSync", async () => {
        assert.throws(() => nsp.parse('${test:SyntaxErrorFnSync()}').toFn()({}));
    });

    it("NormalErrorTagSync", async () => {
        assert.doesNotThrow(() => nsp.parse('<test:NormalErrorTagSync/>').toFn()({}));
    });

    it("SyntaxErrorTagSync", async () => {
        assert.throws(() => nsp.parse('<test:SyntaxErrorTagSync/>').toFn()({}));
    });

    it("NormalErrorTagAsync", async () => {
        await assert.doesNotReject(async () => nsp.parse('<test:NormalErrorTagAsync/>').toFn()({}));
    });

    it("SyntaxErrorTagAsync", async () => {
        await assert.rejects(async () => nsp.parse('<test:SyntaxErrorTagAsync/>').toFn()({}));
    });
});

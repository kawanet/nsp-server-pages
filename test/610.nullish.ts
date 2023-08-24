import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "610.nullish.ts";

describe(TITLE, () => {
    const nspD = createNSP({});
    const nspT = createNSP({nullish: true});
    const nspF = createNSP({nullish: false});

    const optD = JSON.stringify({});
    const optT = JSON.stringify({nullish: true});
    const optF = JSON.stringify({nullish: false});

    it("null", async () => {
        const doc: string = "[${foo}]";
        const ctx = {foo: null as string};
        assert.equal(nspD.parse(doc).toFn()(ctx), "[]", optD);
        assert.equal(nspT.parse(doc).toFn()(ctx), "[null]", optT);
        assert.equal(nspF.parse(doc).toFn()(ctx), "[]", optF);
    });

    it("undefined", async () => {
        const doc: string = "[${foo}]";
        const ctx = {foo: undefined as string};
        assert.equal(nspD.parse(doc).toFn()(ctx), "[]", optD);
        assert.equal(nspT.parse(doc).toFn()(ctx), "[undefined]", optT);
        assert.equal(nspF.parse(doc).toFn()(ctx), "[]", optF);
    });
});

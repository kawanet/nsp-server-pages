import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "340.store.ts";

interface ATTR {
    //
}

interface CTX {
    //
}

interface Data {
    counter: number;
}

const storeKey = "test:tag1";

describe(TITLE, () => {
    const nsp = createNSP({nullish: true});

    nsp.addTagLib({
        ns: "test",
        tag: {
            counter: (tag: NSP.TagDef<ATTR, CTX>) => {
                return (v: CTX) => {
                    const obj = tag.app.store<Data>(v, storeKey, () => ({counter: 0}));
                    obj.counter++;
                    return String(obj.counter);
                };
            }
        },
    });

    it("<test:counter/>", async () => {
        const ctx1: CTX = {};
        assert.equal(nsp.parse('[<test:counter/>]').toFn()(ctx1), "[1]");
        assert.equal(nsp.parse('[<test:counter/>]').toFn()(ctx1), "[2]");

        const ctx2: CTX = {};
        assert.equal(nsp.parse('(<test:counter/>)').toFn()(ctx2), "(1)");
        assert.equal(nsp.parse('(<test:counter/>)').toFn()(ctx2), "(2)");
    });
});

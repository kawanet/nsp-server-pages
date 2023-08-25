import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "340.store.ts";

interface ATTR {
    //
}

interface CTX {
    //
}

describe(TITLE, () => {
    const nsp = createNSP({nullish: true});

    nsp.addTagLib({
        ns: "test",
        tag: {
            counter: (tag: NSP.TagDef<ATTR, CTX>) => {
                return (v: CTX) => {
                    const store = tag.app.store<number>(v, "test:tag1");
                    const counter = (store.get() ?? 0) + 1;
                    store.set(counter);
                    return String(counter);
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

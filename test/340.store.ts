import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "340.store.ts";

interface TagAttr {
    //
}

describe(TITLE, () => {
    const nsp = createNSP({nullish: true});

    const counterTag: NSP.TagFn<TagAttr> = (tag) => {
        return (context) => {
            const store = tag.app.store<number>(context, "test:counter");
            const counter = (store.get() ?? 0) + 1;
            store.set(counter);
            return String(counter);
        };
    };

    nsp.addTagLib({ns: "test", tag: {counter: counterTag}});

    it("<test:counter/>", async () => {
        const ctx1 = {};
        assert.equal(nsp.parse('[<test:counter/>]').toFn()(ctx1), "[1]");
        assert.equal(nsp.parse('[<test:counter/>]').toFn()(ctx1), "[2]");

        const ctx2 = {};
        assert.equal(nsp.parse('(<test:counter/>)').toFn()(ctx2), "(1)");
        assert.equal(nsp.parse('(<test:counter/>)').toFn()(ctx2), "(2)");
    });
});

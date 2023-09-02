import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "340.store.ts";

interface Context {
    start?: number;
}

interface TagAttr {
    start?: string | number;
}

describe(TITLE, () => {
    const nsp = createNSP({nullish: true});

    const counterTag: NSP.TagFn<TagAttr> = (tag) => {
        return (context) => {
            const store = tag.app.store<number>(context, "test:counter");
            const prev = store.get()
            const {start} = tag.attr(context);
            const counter = (prev != null) ? (prev + 1) : (start != null) ? (+start || 0) : 1;
            store.set(counter);
            return String(counter);
        };
    };

    nsp.addTagLib({ns: "test", tag: {counter: counterTag}});

    it("<test:counter/>", async () => {
        const render1 = nsp.parse('[<test:counter start="${start}"/>][<test:counter/>][<test:counter/>]').toFn<Context>();

        assert.equal(render1({}), "[1][2][3]");

        assert.equal(render1({start: 10}), "[10][11][12]");

        assert.equal(render1({}), "[1][2][3]"); // reset

        // Context must be an object
        await assert.rejects(async () => render1(null));
    });
});

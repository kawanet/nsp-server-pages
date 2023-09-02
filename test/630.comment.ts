import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "630.comment.ts";

describe(TITLE, () => {
    const nspD = createNSP({});
    const nspT = createNSP({comment: true});
    const nspF = createNSP({comment: false});

    const optD = JSON.stringify({});
    const optT = JSON.stringify({comment: true});
    const optF = JSON.stringify({comment: false});

    it("comment", async () => {
        const doc: string = "[<test:tag/>]";
        const ctx = {};

        const parsedD = nspD.parse(doc);
        const parsedT = nspT.parse(doc);
        const parsedF = nspF.parse(doc);

        assert.equal(parsedD.toFn()(ctx), doc, optD);
        assert.equal(parsedT.toFn()(ctx), doc, optT);
        assert.equal(parsedF.toFn()(ctx), doc, optF);

        assert.doesNotMatch(parsedD.toJS(), /\/\//, optD);
        assert.match(parsedT.toJS(), /\/\//, optT);
        assert.doesNotMatch(parsedF.toJS(), /\/\//, optF);
    });
});

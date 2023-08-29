import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "620.indent.ts";

describe(TITLE, () => {
    const ctx = {qux: "QUX"};

    const nspD = createNSP({});
    const nsp0 = createNSP({indent: 0});
    const nsp4 = createNSP({indent: 4});
    const nspE = createNSP({indent: ""});
    const nspS = createNSP({indent: "    "});
    const nspT = createNSP({indent: "\t"});

    const optD = JSON.stringify({});
    const opt0 = JSON.stringify({indent: 0});
    const opt4 = JSON.stringify({indent: 4});
    const optE = JSON.stringify({indent: ""});
    const optS = JSON.stringify({indent: "    "});
    const optT = JSON.stringify({indent: "\t"});

    const doc: string = '<tag:foo bar="BAR" buz="BUZ">[${qux}]</tag:foo>';
    const expected = `<tag:foo bar="BAR" buz="BUZ">[QUX]</tag:foo>`;
    let result0: string;
    let result4: string;

    it(optD, async () => {
        result0 = nspD.parse(doc).toJS();
        assert.equal(nspD.parse(doc).toFn()(ctx), expected);
    });

    it(opt0, async () => {
        assert.equal(nsp0.parse(doc).toJS(), result0);
        assert.equal(nsp0.parse(doc).toFn()(ctx), expected);
    });

    it(opt4, async () => {
        result4 = nsp4.parse(doc).toJS();
        assert.equal(nsp4.parse(doc).toFn()(ctx), expected);
    });

    it(optE, async () => {
        assert.equal(nspE.parse(doc).toJS(), result0);
        assert.equal(nspE.parse(doc).toFn()(ctx), expected);
    });

    it(optS, async () => {
        assert.equal(nspS.parse(doc).toJS(), result4);
        assert.equal(nspS.parse(doc).toFn()(ctx), expected);
    });

    it(optT, async () => {
        assert.equal(nspT.parse(doc).toJS().replace(/\t/g, "    "), result4);
        assert.equal(nspT.parse(doc).toFn()(ctx), expected);
    });
});

import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "600.trim-spaces.ts";

describe(TITLE, () => {
    const ctx = {};

    const tag = {
        L: () => () => "[",
        R: () => () => "]",
    };

    const nspD = createNSP({});
    const nspT = createNSP({trimSpaces: true});
    const nspF = createNSP({trimSpaces: false});

    const optD = JSON.stringify({});
    const optT = JSON.stringify({trimSpaces: true});
    const optF = JSON.stringify({trimSpaces: false});

    // import tags
    nspD.addTagLib({ns: "tag", tag});
    nspT.addTagLib({ns: "tag", tag});
    nspF.addTagLib({ns: "tag", tag});

    it("space", async () => {
        const doc: string = ` <tag:L/> <tag:R/> `;
        assert.equal(nspD.parse(doc).toFn()(ctx), "[]", optD);
        assert.equal(nspT.parse(doc).toFn()(ctx), "[]", optT);
        assert.equal(nspF.parse(doc).toFn()(ctx), " [ ] ", optF);
    });

    it("LF", async () => {
        const doc: string = "\n<tag:L/>\n<tag:R/>\n";
        assert.equal(nspD.parse(doc).toFn()(ctx), "[]", optD);
        assert.equal(nspT.parse(doc).toFn()(ctx), "[]", optT);
        assert.equal(nspF.parse(doc).toFn()(ctx), "\n[\n]\n", optF);
    });

    it("LF + indent", async () => {
        const doc: string = "\n  <tag:L/>\n  <tag:R/>\n";
        assert.equal(JSON.stringify(nspD.parse(doc).toFn()(ctx)), JSON.stringify("[]"), optD);
        assert.equal(JSON.stringify(nspT.parse(doc).toFn()(ctx)), JSON.stringify("[]"), optT);
        assert.equal(JSON.stringify(nspF.parse(doc).toFn()(ctx)), JSON.stringify("\n  [\n  ]\n"), optF);
    });

    it("edge space", async () => {
        const doc: string = " ( <tag:L/> | <tag:R/> ) ";
        assert.equal(nspD.parse(doc).toFn()(ctx), " ( [ | ] ) ", optD);
        assert.equal(nspT.parse(doc).toFn()(ctx), " ( [ | ] ) ", optT);
        assert.equal(nspF.parse(doc).toFn()(ctx), " ( [ | ] ) ", optF);
    });

    it("edge LF + indent", async () => {
        const doc: string = "\n  (\n  <tag:L/>\n  |\n  <tag:R/>\n  )\n";
        assert.equal(JSON.stringify(nspD.parse(doc).toFn()(ctx)), JSON.stringify("\n  (\n[\n  |\n]\n  )\n"), optD);
        assert.equal(JSON.stringify(nspT.parse(doc).toFn()(ctx)), JSON.stringify("\n  (\n[\n  |\n]\n  )\n"), optT);
        assert.equal(JSON.stringify(nspF.parse(doc).toFn()(ctx)), JSON.stringify("\n  (\n  [\n  |\n  ]\n  )\n"), optF);
    });
});

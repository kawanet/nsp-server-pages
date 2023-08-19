import {strict as assert} from "assert";
import {createNSP} from "../index.js";
import {parseText} from "../src/parse-text.js";
import {parseAttr} from "../src/parse-attr.js";

const TITLE = "220.async.ts";

describe(TITLE, () => {
    const nsp = createNSP();

    interface Context {
        foo?: string | Promise<string>;
    }

    it(`[#{ Promise }]`, async () => {
        const src = "[#{ foo }]";
        const fn = parseText(nsp, src).toFn<Context>();

        assert.equal(await fn({foo: "FOO"}), "[FOO]", "#1");
        assert.equal(await fn({foo: Promise.resolve("Foo")}), "[Foo]", "#2");
    });

    it(`<tag foo="#{ foo }"/>`, async () => {
        const src = `<tag foo="[#{ foo }]"/>`;
        const fn = parseAttr(nsp, src).toFn<Context>();

        assert.equal(await fn({foo: "FOO"}).foo, "[FOO]", "#1");
        assert.equal(await fn({foo: Promise.resolve("Foo")}).foo, "[Foo]", "#2");
    });
});

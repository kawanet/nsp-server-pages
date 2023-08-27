import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "220.async.ts";

interface TagAttr {
    foo: string | Promise<string>;
}

interface Context {
    foo?: string | Promise<string>;
}

describe(TITLE, () => {
    const nsp = createNSP();

    const getFooTag: NSP.TagFn<TagAttr> = (tag) => {
        return (context) => {
            const attr = tag.attr(context);
            return attr.foo;
        };
    };

    nsp.addTagLib({ns: "test", tag: {getFoo: getFooTag}});

    it(`[#{ Promise }]`, async () => {
        const src = "[#{ foo }]";
        const fn = nsp.parse(src).toFn<Context>();

        assert.equal(await fn({foo: "FOO"}), "[FOO]", "#1");
        assert.equal(await fn({foo: Promise.resolve("Foo")}), "[Foo]", "#2");
    });

    it(`<tag foo="#{ foo }"/>`, async () => {
        const src = `<test:getFoo foo="[#{ foo }]"/>`;
        const fn = nsp.parse(src).toFn<Context>();

        assert.equal(await fn({foo: "FOO"}), "[FOO]", "#1");
        assert.equal(await fn({foo: Promise.resolve("Foo")}), "[Foo]", "#2");
    });
});

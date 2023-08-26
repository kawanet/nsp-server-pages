import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "210.attr.ts";

interface TagAttr {
    foo: string;
    bar: string;
}

describe(TITLE, () => {
    const nsp = createNSP();

    const attrJsonTag: NSP.TagFn<TagAttr> = (tag) => {
        return (context) => {
            const attr = tag.attr(context);
            return JSON.stringify(attr);
        };
    };

    nsp.addTagLib({ns: "test", tag: {attrJson: attrJsonTag}});

    const ctx = {};

    it('single attribute', async () => {
        const fn = nsp.parse('<test:attrJson foo="Foo"/>').toFn();
        assert.equal(fn(ctx), '{"foo":"Foo"}');
    });

    it('multiple attributes', async () => {
        const fn = nsp.parse('<test:attrJson foo="Foo" bar="Bar"/>').toFn();
        assert.equal(fn(ctx), '{"foo":"Foo","bar":"Bar"}');
    });

    it(`dynamic attributes`, async () => {
        const fn = nsp.parse('<test:attrJson foo="${FOO}" bar="${BAR}"/>').toFn();
        assert.equal(fn({FOO: "Foo", BAR: "Bar"}), '{"foo":"Foo","bar":"Bar"}');
    });
});

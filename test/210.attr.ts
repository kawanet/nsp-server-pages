import {strict as assert} from "assert";
import {createNSP} from "../index.js";
import {parseAttr} from "../src/parse-attr.js";

const TITLE = "210.attr.ts";

describe(TITLE, () => {
    const nsp = createNSP();
    const ctx = {};

    it('empty tag', async () => {
        const fn = parseAttr(nsp, '<tag/>').toFn();
        assert.deepEqual(fn(ctx), null);
    });

    it('single attribute', async () => {
        const fn = parseAttr(nsp, '<tag foo="Foo"/>').toFn();
        assert.deepEqual(fn(ctx), {foo: "Foo"});
    });

    it('multiple attributes', async () => {
        const fn = parseAttr(nsp, '<tag foo="Foo" bar="Bar"/>').toFn();
        assert.deepEqual(fn(ctx), {foo: "Foo", bar: "Bar"});
    });

    it(`dynamic attributes`, async () => {
        const fn = parseAttr(nsp, '<tag foo="${FOO}" bar="${BAR}"/>').toFn();
        assert.deepEqual(fn({FOO: "Foo", BAR: "Bar"}), {foo: "Foo", bar: "Bar"});
    });
});

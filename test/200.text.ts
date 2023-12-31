import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "200.text.ts";

describe(TITLE, () => {
    const nsp = createNSP();

    it(`static content`, async () => {
        const context = {};
        const fn = nsp.parse("ABC").toFn();
        const expected = "ABC";

        assert.equal(fn(context), expected);
    });

    it(`Dynamic content`, async () => {
        const context = {foo: "FOO", bar: ""};
        const fn = nsp.parse("[${ foo }][${ bar }]").toFn<typeof context>();
        const expected = "[FOO][]";

        assert.equal(fn(context), expected);
    });

    it(`dot`, async () => {
        const context = {foo: {bar: {buz: "BUZ"}}};
        const fn = nsp.parse("[${ foo.bar.buz }]").toFn<typeof context>();
        const expected = "[BUZ]";

        assert.equal(fn(context), expected);
    });

    it(`primitive`, async () => {
        const context = {};
        const fn = nsp.parse("[${ 1 }][${ 'string' }]").toFn();
        const expected = "[1][string]";

        assert.equal(fn(context), expected);
    });

    it(`expression`, async () => {
        const fn = nsp.parse("[${ foo > 1 }][${ bar == 'Bar' }]").toFn();

        assert.equal(fn({foo: 2, bar: "Bar"}), `[true][true]`);
        assert.equal(fn({foo: 0, bar: "Foo"}), `[false][false]`);
    });

    it(`complex`, async () => {
        const fn = nsp.parse("[${(foo == null and bar == '') or buz != qux}]").toFn();

        assert.equal(fn({foo: null, bar: ""}), `[true]`, "#1");
        assert.equal(fn({foo: null, bar: "Bar"}), `[false]`, "#2");
        assert.equal(fn({foo: "Foo", bar: ""}), `[false]`, "#3");
        assert.equal(fn({foo: "Foo", bar: "Bar"}), `[false]`, "#4");
        assert.equal(fn({buz: "Buz", qux: "Qux"}), `[true]`, "#5");
        assert.equal(fn({buz: "BuzQux", qux: "BuzQux"}), `[false]`, "#6");
    });

    it(`complex with dot`, async () => {
        const fn = nsp.parse("[${foo.bar != null || foo.buz != null}]").toFn();

        assert.equal(fn({foo: {bar: null, buz: null}}), `[false]`, "#1");
        assert.equal(fn({foo: {bar: null, buz: "Buz"}}), `[true]`, "#2");
        assert.equal(fn({foo: {bar: "Bar", buz: null}}), `[true]`, "#3");
        assert.equal(fn({foo: {bar: "Bar", buz: "Buz"}}), `[true]`, "#4");
    });

    it(`ternary operator`, async () => {
        const fn = nsp.parse("[${ foo ? 'T' : 'F' }]").toFn();

        assert.equal(fn({foo: true}), "[T]");
        assert.equal(fn({foo: false}), "[F]");
    });

    it(`brackets[]`, async () => {
        const fn = nsp.parse("[${ foo[bar + buz] }]").toFn();

        assert.equal(fn({foo: {BarBuz: "Foo"}, bar: "Bar", buz: "Buz"}), "[Foo]");
    });

    it(`parentheses()`, async () => {
        const fn = nsp.parse("[${ foo(bar + buz) }]").toFn();

        assert.equal(fn({foo: (s: string) => s?.toUpperCase(), bar: "Bar", buz: "Buz"}), "[BARBUZ]");
    });

    it(`property accessors`, async () => {
        const fn = nsp.parse("[${ foo.bar['buz'] }]").toFn();

        assert.equal(fn({foo: {bar: {buz: "FooBarBuz"}}}), "[FooBarBuz]");
        assert.equal(fn({foo: {bar: {buz: null}}}), "[]");
        assert.equal(fn({foo: {bar: null}}), "[]");
        assert.equal(fn({foo: null}), "[]");
    });

    it(`optional chaining`, async () => {
        const fn = nsp.parse("[${ foo?.bar?.['buz'] }]").toFn();

        assert.equal(fn({foo: {bar: {buz: "FooBarBuz"}}}), "[FooBarBuz]");
        assert.equal(fn({foo: {bar: {buz: null}}}), "[]");
        assert.equal(fn({foo: {bar: null}}), "[]");
        assert.equal(fn({foo: null}), "[]");
    });
});

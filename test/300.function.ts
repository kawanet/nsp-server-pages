import {strict as assert} from "assert";
import {createNSP} from "../index.js";
import {parseAttr} from "../src/parse-attr.js";
import {parseText} from "../src/parse-text.js";

const TITLE = "300.function.ts";

describe(TITLE, () => {
    const nsp = createNSP();
    const ctx = {};

    nsp.addTagLib({
        ns: "test",
        fn: {
            foobar: () => "FooBar",
            upper: (str: string) => String(str).toUpperCase(),
            add: (a: string, b: string) => String((+a) + (+b)),
        },
    })

    it("test:foobar()", async () => {
        assert.equal(parseText(nsp, '${test:foobar()}').toFn()(ctx), "FooBar");

        assert.deepEqual(parseAttr(nsp, '<some:tag value="${test:foobar()}"/>').toFn()(ctx), {value: "FooBar"});

        assert.equal(nsp.parse('[${test:foobar()}]').toFn()(ctx), "[FooBar]");
    });

    it("test:upper(str)", async () => {
        assert.equal(parseText(nsp, '${test:upper("abc")}').toFn()(ctx), "ABC");

        assert.deepEqual(parseAttr(nsp, '<some:tag value="${test:upper(\'abc\')}"/>').toFn()(ctx), {value: "ABC"});

        assert.equal(nsp.parse('[${test:upper("abc")}]').toFn()(ctx), "[ABC]");
    });

    it("test:add(a, b)", async () => {
        assert.equal(parseText(nsp, '${test:add(1, 1)}').toFn()(ctx), "2");

        assert.deepEqual(parseAttr(nsp, '<some:tag value="${test:add(2, 2)}"/>').toFn()(ctx), {value: "4"});

        assert.equal(nsp.parse('[${test:add(3, 3)}]').toFn()(ctx), "[6]");
    });

    it("test:upper(str) with context", async () => {
        const context = {bar: "BAR"};

        assert.equal(parseText(nsp, '${test:upper(bar)}').toFn()(context), "BAR");

        assert.deepEqual(parseAttr(nsp, '<some:tag value="${test:upper(bar)}"/>').toFn()(context), {value: "BAR"});

        assert.equal(nsp.parse('[${test:upper(bar)}]').toFn()(context), "[BAR]");
    });
});

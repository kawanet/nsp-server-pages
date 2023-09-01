import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "300.function.ts";

interface TagAttr {
    foo: string;
}

describe(TITLE, () => {
    const nsp = createNSP();
    const ctx = {};

    const getFooTag: NSP.TagFn<TagAttr> = (tag) => {
        return context => {
            const attr = tag.attr(context);
            return attr.foo;
        };
    };

    nsp.addTagLib({
        ns: "test",
        fn: {
            foobar: () => "FooBar",
            upper: (str: string) => String(str).toUpperCase(),
            add: (a: string, b: string) => String((+a) + (+b)),
        },
        tag: {
            getFoo: getFooTag,
        },
    });

    it("test:foobar()", async () => {
        assert.equal(nsp.parse('${test:foobar()}').toFn()(ctx), "FooBar");

        assert.equal(nsp.parse('<test:getFoo foo="${test:foobar()}"/>').toFn()(ctx), "FooBar");

        assert.equal(nsp.parse('[${test:foobar()}]').toFn()(ctx), "[FooBar]");
    });

    it("test:upper(str)", async () => {
        assert.equal(nsp.parse('${test:upper("abc")}').toFn()(ctx), "ABC");

        assert.equal(nsp.parse('<test:getFoo foo="${test:upper(\'abc\')}"/>').toFn()(ctx), "ABC");

        assert.equal(nsp.parse('[${test:upper("abc")}]').toFn()(ctx), "[ABC]");
    });

    it("test:add(a, b)", async () => {
        assert.equal(nsp.parse('${test:add(1, 1)}').toFn()(ctx), "2");

        assert.equal(nsp.parse('<test:getFoo foo="${test:add(2, 2)}"/>').toFn()(ctx), "4");

        assert.equal(nsp.parse('[${test:add(3, 3)}]').toFn()(ctx), "[6]");
    });

    it("test:upper(str) with context", async () => {
        const context = {bar: "BAR"};

        assert.equal(nsp.parse('${test:upper(bar)}').toFn()(context), "BAR");

        assert.equal(nsp.parse('<test:getFoo foo="${test:upper(bar)}"/>').toFn()(context), "BAR");

        assert.equal(nsp.parse('[${test:upper(bar)}]').toFn()(context), "[BAR]");
    });

    it("unregistered function call", async () => {
        assert.throws(() => nsp.parse('${test:unregistered()}').toFn()(ctx));
    });

    it("invalid function registration", () => {
        assert.throws(() => nsp.addTagLib({ns: "test", fn: {invalid: [] as any}}));
    });
});

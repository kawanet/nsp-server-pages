import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "500.nsp-load.ts";

interface Context {
    foo: string;
    bar: string;
}

describe(TITLE, () => {
    const nsp = createNSP();

    nsp.mount("/foo/", async () => {
        return (context: Context) => {
            const {foo} = context;
            return `[${foo}]`;
        }
    });

    nsp.mount("/bar/", async () => {
        return (context: Context) => {
            const {bar} = context;
            return `[${bar}]`;
        }
    });

    nsp.mount("/both/", async () => {
        return (context: Context) => {
            const {foo, bar} = context;
            return `[${foo}][${bar}]`;
        }
    });

    it("nsp.load()", async () => {
        const ctx = {foo: "FOO", bar: "BAR"};

        assert.equal((await nsp.load<Context>("/foo/"))(ctx), "[FOO]");
        assert.equal((await nsp.load<Context>("/bar/"))(ctx), "[BAR]");
        assert.equal((await nsp.load<Context>("/both/"))(ctx), "[FOO][BAR]");
    });

    it("nsp.load() with query parameters", async () => {
        const ctx = {foo: "FOO", bar: "BAR"};

        assert.equal((await nsp.load<Context>("/foo/?foo=Foo"))(ctx), "[Foo]");
        assert.equal((await nsp.load<Context>("/bar/?bar=Bar"))(ctx), "[Bar]");
        assert.equal((await nsp.load<Context>("/both/?foo=Fooo&bar=Baar"))(ctx), "[Fooo][Baar]");
    });

    it("not found", async () => {
        assert.rejects(() => nsp.load("/not/found/"));
    });
});

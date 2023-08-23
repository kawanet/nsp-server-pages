import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "310.tag.ts";

interface ATTR {
    //
}

interface CTX {
    //
}

describe(TITLE, () => {
    const nsp = createNSP();
    const attr: ATTR = {};
    const ctx: CTX = {};

    nsp.addTagLib({
        ns: "test",
        tag: {
            body: (tag: NSP.TagDef<ATTR, CTX>) => {
                return async (v: CTX) => {
                    let body = await tag.body(v);
                    return (body == null) ? "null" : (body === "") ? "empty" : ("string" === typeof body) ? body : typeof body;
                };
            }
        },
    });

    it("undefined body", async () => {
        assert.equal(await nsp.tag("test:body", attr)(ctx), "null", "none of argments");
        assert.equal(await nsp.tag("test:body", attr, undefined)(ctx), "null", "undefined argument");
        assert.equal(await nsp.tag("test:body", attr, () => undefined)(ctx), "null", "function returns undefined");
        assert.equal(await nsp.tag("test:body", attr, async () => undefined)(ctx), "null", "async function returns undefined");
    });

    it("null body", async () => {
        assert.equal(await nsp.tag("test:body", attr, null)(ctx), "null", "null argument");
        assert.equal(await nsp.tag("test:body", attr, () => null)(ctx), "null", "function returns null");
        assert.equal(await nsp.tag("test:body", attr, async () => null)(ctx), "null", "async function returns null");
    });

    it("empty string body", async () => {
        assert.equal(await nsp.tag("test:body", attr, "")(ctx), "empty", "empty string");
        assert.equal(await nsp.tag("test:body", attr, () => "")(ctx), "empty", "function returns empty string");
        assert.equal(await nsp.tag("test:body", attr, async () => "")(ctx), "empty", "async function returns empty string");
    });

    it("filled string body", async () => {
        assert.equal(await nsp.tag("test:body", attr, "FOO")(ctx), "FOO");
        assert.equal(await nsp.tag("test:body", attr, () => "BAR")(ctx), "BAR");
        assert.equal(await nsp.tag("test:body", attr, async () => "BUZ")(ctx), "BUZ");
    });

    it("empty tag", async () => {
        assert.equal(await nsp.parse(`[<test:body/>]`).toFn()(ctx), "[null]");
    });

    it("empty body", async () => {
        assert.equal(await nsp.parse(`[<test:body></test:body>]`).toFn()(ctx), "[empty]");
    });

    it("string body", async () => {
        assert.equal(await nsp.parse(`[<test:body>FOO</test:body>]`).toFn()(ctx), "[FOO]");
    });

    it("nested", async () => {
        assert.equal(await nsp.parse(`[<test:body><test:body/></test:body>]`).toFn()(ctx), "[null]");
        assert.equal(await nsp.parse(`[<test:body><test:body></test:body></test:body>]`).toFn()(ctx), "[empty]");
        assert.equal(await nsp.parse(`[<test:body><test:body>FOO</test:body></test:body>]`).toFn()(ctx), "[FOO]");
    });

    it("unregistered tag", async () => {
        assert.equal(await nsp.parse(`<test:na/>`).toFn()(ctx), `<test:na/>`);
        assert.equal(await nsp.parse(`<test:na></test:na>`).toFn()(ctx), `<test:na></test:na>`);
        assert.equal(await nsp.parse(`<test:na>FOO</test:na>`).toFn()(ctx), `<test:na>FOO</test:na>`);
        assert.equal(await nsp.parse(`<test:na><test:na/></test:na>`).toFn()(ctx), `<test:na><test:na/></test:na>`);
    });
});

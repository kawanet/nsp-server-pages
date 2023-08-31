import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "350.tag-class.ts";

interface TagAttr {
    //
}

describe(TITLE, () => {
    const nsp = createNSP();
    const ctx = {};

    class BodyTag implements NSP.TagClass {
        constructor(private tag: NSP.TagDef<TagAttr>, private context: any) {
            //
        }

        async render() {
            const body = await this.tag.body(this.context);
            return (body == null) ? "null" : (body === "") ? "empty" : ("string" === typeof body) ? body : typeof body;
        }
    }

    nsp.addTagLib({ns: "test", tag: {body: BodyTag}});

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

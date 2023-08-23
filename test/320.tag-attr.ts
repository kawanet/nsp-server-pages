import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "320.tag-attr.ts";

interface ATTR {
    value: any;
}

interface CTX {
    data?: any;
}

describe(TITLE, () => {
    const nsp = createNSP({nullish: true});

    nsp.addTagLib({
        ns: "test",
        tag: {
            tag1: (tag: NSP.TagDef<ATTR, CTX>) => {
                return (v: CTX) => {
                    const {value} = tag.attr(v);
                    return (value == null) ? "null" :
                        (value === "") ? "empty" :
                            ("string" === typeof value) ? value :
                                (("object" === typeof value) && value?.constructor?.name || typeof value);
                };
            }
        },
    });

    it("static attribute", async () => {
        const ctx: CTX = {};

        assert.equal(nsp.parse('[<test:tag1/>]').toFn()(ctx), "[null]");
        assert.equal(nsp.parse('[<test:tag1 value=""/>]').toFn()(ctx), "[empty]");
        assert.equal(nsp.parse('[<test:tag1 value="FOO"/>]').toFn()(ctx), "[FOO]");
    });

    it("dynamic attribute", async () => {
        const render = nsp.parse('[<test:tag1 value="${data}"/>]').toFn();

        assert.equal(render({data: ""}), "[empty]");
        assert.equal(render({data: "FOO"}), "[FOO]");
        assert.equal(render({data: 123}), "[number]");
    });

    // not sure to be compliant with JSP specification
    it("object attribute", async () => {
        const render = nsp.parse('[<test:tag1 value="${data}"/>]').toFn();
        assert.equal(render({data: null}), "[null]");
        assert.equal(render({data: new Date()}), "[Date]");
    });
});

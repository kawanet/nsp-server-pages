import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "320.tag-attr.ts";

interface TagAttr {
    value: any;
}

interface Context {
    data?: any;
}

describe(TITLE, () => {
    const nsp = createNSP({nullish: true});

    const typeOfTag: NSP.TagFn<TagAttr, Context> = (tag) => {
        return (context) => {
            const {value} = tag.attr(context);
            return (value == null) ? "null" :
                (value === "") ? "empty" :
                    ("string" === typeof value) ? value :
                        (("object" === typeof value) && value?.constructor?.name || typeof value);
        };
    };

    nsp.addTagLib({ns: "test", tag: {typeOf: typeOfTag}});

    it("static attribute", async () => {
        const ctx: Context = {};

        assert.equal(nsp.parse('[<test:typeOf/>]').toFn()(ctx), "[null]");
        assert.equal(nsp.parse('[<test:typeOf value=""/>]').toFn()(ctx), "[empty]");
        assert.equal(nsp.parse('[<test:typeOf value="FOO"/>]').toFn()(ctx), "[FOO]");
    });

    it("dynamic attribute", async () => {
        const render = nsp.parse('[<test:typeOf value="${data}"/>]').toFn();

        assert.equal(render({data: ""}), "[empty]");
        assert.equal(render({data: "FOO"}), "[FOO]");
        assert.equal(render({data: 123}), "[number]");
    });

    // not sure to be compliant with JSP specification
    it("object attribute", async () => {
        const render = nsp.parse('[<test:typeOf value="${data}"/>]').toFn();
        assert.equal(render({data: null}), "[null]");
        assert.equal(render({data: new Date()}), "[Date]");
    });
});

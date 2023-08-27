import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "410.hook-parse-tag.ts";

interface Context {
    foo?: string;
    bar?: string;
    buz?: string;
}

/**
 * <c:set>
 */
interface SetTagAttr {
    var?: string;
    value?: string;
}

/**
 * <c:out>
 */
interface OutTagAttr {
    value: string;
    default?: string;
}

describe(TITLE, () => {
    const nsp = createNSP({nullish: true});

    nsp.hook<SetTagAttr>("parse.tag.c:set", tag => {
        const {vName} = tag.app.options;
        const varJS = tag.attr.get("var");
        const isSimple = /^"[A-Za-z]\w*"$/.test(varJS);
        const accessor = isSimple ? "." + JSON.parse(varJS) : `[${varJS}]`;
        const value = tag.attr.get("value");

        return `${vName} => { ${vName}${accessor} = ${value} }`;
    });

    nsp.hook<OutTagAttr>("parse.tag.c:out", tag => {
        const {vName} = tag.app.options;
        const value = tag.attr.get("value");
        const defaultJS = tag.attr.get("default");

        if (defaultJS) {
            return `${vName} => (${value} || ${defaultJS})`;
        } else {
            return `${vName} => (${value})`;
        }
    });

    it("<c:out/>", async () => {
        const parsed = nsp.parse('[<c:out value="${bar}"/>]');
        // console.warn(parsed.toJS());
        const render = parsed.toFn<Context>();

        assert.equal(render({bar: "Bar"}), "[Bar]");
    });

    it("<c:set/><c:out/>", async () => {
        const parsed = nsp.parse('[<c:set var="bar" value="${foo}"/>][<c:out value="${bar}" default="${buz}"/>]');
        // console.warn(parsed.toJS());
        const render = parsed.toFn<Context>();

        assert.equal(render({}), "[][]");

        assert.equal(render({foo: "Foo"}), "[][Foo]");

        assert.equal(render({bar: "Bar"}), "[][]");

        assert.equal(render({buz: "Buz"}), "[][Buz]");
    });
});

import {strict as assert} from "assert";
import {createNSP, NSP} from "../index.js";

const TITLE = "360.function-this.ts";

describe(TITLE, () => {
    const nsp = createNSP();
    const ctx = {};

    nsp.addTagLib({
        ns: "test",
        fn: {thisIsApp, thisIsNull}
    });

    function thisIsApp(this: NSP.App) {
        return this instanceof nsp.constructor;
    }

    function thisIsNull(this: NSP.App) {
        return this == null;
    }

    it("test:thisIsApp()", async () => {
        assert.equal(nsp.parse('[${test:thisIsApp()}]').toFn()(ctx), "[true]");
    });

    it("test:thisIsNull()", async () => {
        assert.equal(nsp.parse('[${test:thisIsNull()}]').toFn()(ctx), "[false]");
    });
});

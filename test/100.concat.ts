import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "100.concat.ts";

describe(TITLE, () => {
    const nsp = createNSP();

    it("sync", () => {
        assert.equal(nsp.concat() ?? "null", "null", "#1");

        assert.equal(nsp.concat(null) ?? "null", "null", "#2");

        assert.equal(nsp.concat("foo"), "foo", "#3");

        assert.equal(nsp.concat("foo", "bar"), "foobar", "#4");

        assert.equal(nsp.concat("foo", null, "baz"), "foobaz", "#5");
    });

    it("async", async () => {
        assert.equal(await nsp.concat(Promise.resolve(null)) ?? "null", "null", "#1");

        assert.equal(await nsp.concat(Promise.resolve("foo")), "foo", "#2");

        assert.equal(await nsp.concat(Promise.resolve("foo"), "bar"), "foobar", "#4");

        assert.equal(await nsp.concat("foo", null, Promise.resolve("buz")), "foobuz", "#5");
    });
});

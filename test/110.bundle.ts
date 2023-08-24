import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "110.bundle.ts";

describe(TITLE, () => {
    const nsp = createNSP();
    const ctx = {};

    it("empty arguments", async () => {
        const fn = nsp.bundle();
        assert.equal(fn(ctx), null);
    });

    it("single null", async () => {
        const fn = nsp.bundle(null);
        assert.equal(fn(ctx), null);
    });

    it("multiple nulls", async () => {
        const fn = nsp.bundle(null, null, null);
        assert.equal(fn(ctx), null);
    });

    it("single string", async () => {
        const fn = nsp.bundle("foo");
        assert.equal(fn(ctx), "foo");
    });

    it(`multiple arguments`, async () => {
        const fn = nsp.bundle("foo", "bar", "buz");
        assert.equal(fn(ctx), "foobarbuz");
    });

    it("single functions", async () => {
        const fn = nsp.bundle(() => "foo");
        assert.equal(fn(ctx), "foo");
    });

    it("multiple functions", async () => {
        const fn = nsp.bundle(() => "foo", () => "bar", () => "buz");
        assert.equal(fn(ctx), "foobarbuz");
    });

    it("async function", async () => {
        const fn = nsp.bundle(async () => "foo");
        assert.equal(await fn(ctx), "foo");
    });

    it("multiple async functions", async () => {
        const fn = nsp.bundle(
            async () => "Foo",
            async () => "Bar",
            async () => "Buz",
        );
        assert.equal(await fn(ctx), "FooBarBuz");
    });
});

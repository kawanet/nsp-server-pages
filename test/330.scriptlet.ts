import {strict as assert} from "assert";
import {createNSP} from "../index.js";
import {parseScriptlet} from "../src/parse-scriptlet.js";

const TITLE = "330.scriptlet.ts";

describe(TITLE, () => {
    const nsp = createNSP({logger: {log: () => null}});

    const v = {};

    // <%-- comment --%>
    it("comment", () => {
        // nsp.on("comment", () => "comment");

        assert.equal(nsp.parse(`[<%-- comment --%>]`).toFn()(v), "[]");

        assert.equal(parseScriptlet(nsp, `<%-- comment --%>`).toFn()(v), null);
    });

    // <%! declaration(s) %>
    it("declaration", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<%! foo = "FOO"; %>]`).toFn()(v), "[]");

        nsp.on("declaration", () => "declaration");

        assert.equal(nsp.parse(`[<%! foo = "FOO"; %>]`).toFn()(v), "[declaration]");

        assert.equal(parseScriptlet(nsp, `<%! foo = "FOO"; %>`).toFn()(v), "declaration");
    });

    // <%@ directive %>
    it("directive", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<%@ include %>]`).toFn()(v), "[]");

        nsp.on("directive", () => "directive");

        assert.equal(nsp.parse(`[<%@ page %>]`).toFn()(v), "[directive]");

        assert.equal(parseScriptlet(nsp, `<%@ taglib %>`).toFn()(v), "directive");
    });

    // <%= expression %>
    it("expression", () => {
        // nsp.on("expression", () => "expression");

        assert.equal(nsp.parse(`[<%= buz %>]`).toFn()({buz: "BUZ"}), "[BUZ]");

        assert.equal(parseScriptlet(nsp, `<%= qux %>`).toFn()({qux: "QUX"}), "QUX");
    });

    // <% scriptlet %>
    it("scriptlet", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<% bar = "BAR"; %>]`).toFn()(v), "[]");

        nsp.on("scriptlet", () => "scriptlet");

        assert.equal(nsp.parse(`[<% bar = "BAR"; %>]`).toFn()(v), "[scriptlet]");

        assert.equal(parseScriptlet(nsp, `<% bar = "BAR"; %>`).toFn()(v), "scriptlet");
    });
});

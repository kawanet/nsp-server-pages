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

        nsp.hook("declaration", () => "declaration");

        assert.equal(nsp.parse(`[<%! foo = "FOO"; %>]`).toFn()(v), "[declaration]");

        assert.equal(parseScriptlet(nsp, `<%! foo = "FOO"; %>`).toFn()(v), "declaration");
    });

    // <%@ directive %>
    it("directive", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<%@ include %>]`).toFn()(v), "[]");

        nsp.hook("directive", () => "directive");

        assert.equal(nsp.parse(`[<%@ page %>]`).toFn()(v), "[directive]");

        assert.equal(parseScriptlet(nsp, `<%@ taglib %>`).toFn()(v), "directive");
    });

    // <%= expression %>
    it("expression", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<%= expression1 %>]`).toFn()(v), "[]");

        nsp.hook("expression", () => "expression removed");

        assert.equal(nsp.parse(`[<%= expression2 %>]`).toFn()(v), "[expression removed]");

        assert.equal(parseScriptlet(nsp, `<%= expression3 %>`).toFn()(v), "expression removed");
    });

    // <% scriptlet %>
    it("scriptlet", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<% bar = "BAR"; %>]`).toFn()(v), "[]");

        nsp.hook("scriptlet", () => "scriptlet");

        assert.equal(nsp.parse(`[<% bar = "BAR"; %>]`).toFn()(v), "[scriptlet]");

        assert.equal(parseScriptlet(nsp, `<% bar = "BAR"; %>`).toFn()(v), "scriptlet");
    });
});

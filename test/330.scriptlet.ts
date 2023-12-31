import {strict as assert} from "assert";
import {createNSP} from "../index.js";

const TITLE = "330.scriptlet.ts";

describe(TITLE, () => {
    const nsp = createNSP({logger: {log: () => null}});

    const v = {};

    // <%-- comment --%>
    it("comment", () => {
        // string - comment - string
        assert.equal(nsp.parse(`[<%-- comment --%>]`).toFn()(v), "[]");

        // comment - string - comment
        assert.equal(nsp.parse(`<%-- comment1 --%>[]<%-- comment2 --%>`).toFn()(v), "[]");
    });

    // <%! declaration(s) %>
    it("declaration", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<%! foo = "FOO"; %>]`).toFn()(v), "[]");

        nsp.hook("declaration", () => "declaration");

        assert.equal(nsp.parse(`[<%! foo = "FOO"; %>]`).toFn()(v), "[declaration]");
    });

    // <%@ directive %>
    it("directive", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<%@ include %>]`).toFn()(v), "[]");

        nsp.hook("directive", () => "directive");

        assert.equal(nsp.parse(`[<%@ page %>]`).toFn()(v), "[directive]");
    });

    // <%= expression %>
    it("expression", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<%= expression1 %>]`).toFn()(v), "[]");

        nsp.hook("expression", () => "expression removed");

        assert.equal(nsp.parse(`[<%= expression2 %>]`).toFn()(v), "[expression removed]");

        // expression inside attribute
        assert.equal(nsp.parse(`<test:tag attr="[<%= expression3 %>]"/>`).toFn()(v), '<test:tag attr="[expression removed]"/>');

        assert.equal(nsp.parse(`[<test:tag attr="<%= expression4 %>"/>]`).toFn()(v), '[<test:tag attr="expression removed"/>]');
    });

    // <% scriptlet %>
    it("scriptlet", () => {
        // just ignored per default
        assert.equal(nsp.parse(`[<% bar = "BAR"; %>]`).toFn()(v), "[]");

        nsp.hook("scriptlet", () => "scriptlet");

        assert.equal(nsp.parse(`[<% bar = "BAR"; %>]`).toFn()(v), "[scriptlet]");
    });
});

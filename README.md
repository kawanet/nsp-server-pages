# nsp-server-pages

NSP JavaScript Server Pages for Node.js

[![Node.js CI](https://github.com/kawanet/nsp-server-pages/workflows/Node.js%20CI/badge.svg?branch=main)](https://github.com/kawanet/nsp-server-pages/actions/)
[![npm version](https://img.shields.io/npm/v/nsp-server-pages)](https://www.npmjs.com/package/nsp-server-pages)

- `nsp.parse("...").toFn()` - compile JSP template to JavaScript function
- `nsp.parse("...").toJS()` - transpile JSP template to JavaScript source code
- `${ expression.language }` - basic expression language work mostly
- `${ f:h("tag") }` - tag function call
- `<ns:tag attr="${ expression }"/>` - custom tag library
- See TypeScript declaration [index.d.ts](https://github.com/kawanet/nsp-server-pages/blob/main/index.d.ts) for detail.

## SYNOPSIS

```js
import {createNSP} from "nsp-server-pages";

const nsp = createNSP();

const render = nsp.parse('<span>hello, ${name}</span>').toFn();

const context = {name: "world"};

render(context)
// => <span>hello, world</span>
```

## TAGLIB

```js
const {createNSP} = require("./");
const nsp = createNSP();

nsp.addTagLib({
    ns: "tag",
    tag: {
        loop: (tag) => {
            return (ctx) => {
                return ctx.items.map(item => {
                    ctx.item = item;
                    return tag.body(ctx);
                }).join("");
            };
        }
    }
});

const render = nsp.parse('<select><tag:loop><option value="${item.value}">${item.text}</option></tag:loop></select>').toFn();

const context = {
    items: [
      {value: 1, text: "One"},
      {value: 2, text: "Two"},
    ]
};

render(context);
// => <select><option value="1">One</option><option value="2">Two</option></select>
```

## FUNCTION

```js
const {createNSP} = require("./");
const nsp = createNSP();

nsp.addTagLib({
    ns: "f",
    fn: {
        upper: (text) => text?.toUpperCase(),
    }
});

const render = nsp.parse('<h1>${f:upper(title)}</h1>').toFn();

const context = {title: "nsp"};

render(context);
// => <h1>NSP</h1>
```

## WEB SERVER

```js
import {createNSP} from "nsp-server-pages";

const nsp = createNSP();

// .jsp files compiled on demand
nsp.mount("/view/", (path) => nsp.loadJSP(`${BASE}/src/main/webapp/WEB-INF/${path}`));

// .html files
nsp.mount("/include/", (path) => nsp.loadFile(`${BASE}/htdocs/${path}`));

// .js files pretranspiled
nsp.mount("/cached/", (path) => nsp.loadJS(`${BASE}/cached/${path}`));

const app = express();
app.use("/", async (req, res, next) => {
    const context = {indexDto: {codename: "NSP"}};
    const render = await nsp.load(req.path);
    const html = render(context);
    res.type("html").send(html);
});
```

## LINKS

- https://github.com/kawanet/nsp-server-pages
- https://github.com/kawanet/nsp-jstl-taglib
- https://github.com/kawanet/nsp-struts1-taglib
- https://github.com/apache/tomcat

## LICENSE

```js
// SPDX-License-Identifier: Apache-2.0
```

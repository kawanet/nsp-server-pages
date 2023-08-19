# nsp-server-pages

[![Node.js CI](https://github.com/kawanet/nsp-server-pages/workflows/Node.js%20CI/badge.svg?branch=main)](https://github.com/kawanet/nsp-server-pages/actions/)
[![npm version](https://img.shields.io/npm/v/nsp-server-pages)](https://www.npmjs.com/package/nsp-server-pages)

NSP JavaScript Server Pages for Node.js

- `nsp.parse("...").toFn()` - compile JSP template to JavaScript function
- `nsp.parse("...").toJS()` - transpile JSP template to JavaScript source code
- `${ expression.language }` - basic expression language mostly works as is
- `${ f:h("tag") }` - custom taglib static function call
- `<ns:tag attr="${ expression }"/>` - custom taglib action tag
- `<%-- comments --%>` - comments in JSP just ignored
- See TypeScript declaration [index.d.ts](https://github.com/kawanet/nsp-server-pages/blob/main/index.d.ts) for API detail.

## SYNOPSIS

```js
import {createNSP} from "nsp-server-pages";

const nsp = createNSP();

const render = nsp.parse('<span>hello, ${name}</span>').toFn();

const context = {name: "world"};

render(context)
// => <span>hello, world</span>
```

## TRANSPILE

JSP template document is transpiled to JavaScript template literal, etc.

```js
const nsp = createNSP();

const src = nsp.parse('<span>hello, ${name}</span>').toJS();
// => nsp.bundle(v => `<span>hello, ${v.name}</span>`)

const render = nsp.bundle(v => `<span>hello, ${v.name}</span>`);

render({name: "nsp"});
// => <span>hello, nsp</span>
```

- `nsp.bundle(fn)` method returns a single function which accepts a context and returns a `string` or `Promise<string>` then.

## TAGLIB

Custom tag `<tag:loop/>` could be defined with a simple function as below:

```js
const nsp = createNSP();

nsp.addTagLib({
    ns: "tag",
    tag: {
        loop: (tag) => {
            return (ctx) => {
                const children = ctx.items.map((item) => {
                    ctx.item = item;
                    return tag.body(ctx);
                });
                return nsp.concat(children);
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

- `tag.body(ctx)` returns a `string` or `Promise<string>` with given context.
- `nsp.concat(array)` utility method works like `Array#join()` but allows `Promise<string>` items.
- This means that async tags `async (ctx) => {...}` are allowed as well as sync tags.

## FUNCTION

Custom function `${f:uppper(text)}` is much simple as well:

```js
const nsp = createNSP();

nsp.addTagLib({
    ns: "f",
    fn: {
        upper: (text) => text?.toUpperCase(),
        lower: (text) => text?.toLowerCase(),
    }
});

const render = nsp.parse('<h1>${f:upper(title)}</h1>').toFn();

const context = {title: "nsp"};

render(context);
// => <h1>NSP</h1>
```

## WEB SERVER

Launch web server with Express.js:

```js
const nsp = createNSP();

// .jsp files compiled on demand
nsp.mount("/view/", (path) => nsp.loadJSP(`${BASE}/src/main/webapp/WEB-INF/${path}`));

// .html files
nsp.mount("/include/", (path) => nsp.loadFile(`${BASE}/htdocs/${path}`));

// .js files pretranspiled
nsp.mount("/cached/", (path) => nsp.loadJS(`${BASE}/cached/${path}`));

const app = express();
app.use("/", async (req, res, next) => {
    const context = {indexDto: {name: req.query.name || "nsp"}};
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

import {toXML} from "to-xml";

import type {NSP} from "../index.js";
import type {App} from "./app.js";

const isTagCon = (v: any): v is NSP.TagCon<any> => ("function" === typeof (v as NSP.TagCon<any>)?.prototype?.render);

const tagConToTagFn = <A, T>(Tag: NSP.TagCon<A, T>): NSP.TagFn<A, T> => {
    return (tag) => {
        return (context) => {
            const result = new Tag(tag, context).render();
            if (result) return result as (string | Promise<string>);
        };
    };
};

export function addTagLib(this: App, tagLibDef: NSP.TagLibDef): void {
    const {fnMap, tagMap} = this;
    const {ns, fn, tag} = tagLibDef;

    if (fn) {
        for (const name in fn) {
            const impl = fn[name];
            if (typeof impl === "function") {
                // FnFn is called with App instance as this
                fnMap.set(`${ns}:${name}`, impl.bind(this));
            } else if (impl != null) {
                throw new Error(`Invalid taglib implementation: \${${ns}:${name}()}`);
            }
        }
    }

    if (tag) {
        for (const name in tag) {
            const impl = tag[name];
            if (isTagCon(impl)) {
                // NSP.TagCon
                tagMap.set(`${ns}:${name}`, tagConToTagFn(impl));
            } else if (typeof impl === "function") {
                // NSP.TagFn
                tagMap.set(`${ns}:${name}`, impl);
            } else if (impl != null) {
                throw new Error(`Invalid taglib implementation: <${ns}:${name}>`);
            }
        }
    }
}

export function prepareTag<A, T = any>(this: App, name: string, attr: A | NSP.AttrFn<A, T>, body: NSP.NodeFn<T>): NSP.NodeFn<T> {
    const {tagMap} = this;

    const tagFn: NSP.TagFn<A, T> = tagMap.get(name) || defaultTagFn;

    const attrFn: NSP.AttrFn<A, T> = !attr ? () => ({} as A) : (typeof attr !== "function") ? () => attr : (attr as NSP.AttrFn<A, T>);

    const tagDef: NSP.TagDef<A, T> = {name, app: this, attr: attrFn, body};

    return tagFn(tagDef) as NSP.NodeFn<T>;
}

const defaultTagFn = <A = any, T = any>(tagDef: NSP.TagDef<A, T>) => {
    const {name} = tagDef;
    // tagDef.app.log(`Unknown tag: ${name}`);

    return (context: T) => {
        const attr = tagDef.attr(context);
        const body = tagDef.body(context);

        const xml: any = {};
        xml[name] = {"@": attr};

        let tag = toXML(xml);
        if (body === null) {
            return tag;
        }

        tag = tag.replace(/\/>$/, `>`);

        return tagDef.app.concat(tag, body, `</${name}>`);
    };
};
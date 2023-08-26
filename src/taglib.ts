import {toXML} from "to-xml";

import type {NSP} from "../index.js";
import type {App} from "./app.js";

export function addTagLib(this: App, tagLibDef: NSP.TagLibDef): void {
    const {fnMap, tagMap} = this;
    const {ns, fn, tag} = tagLibDef;

    if (fn) {
        for (const name in fn) {
            fnMap.set(`${ns}:${name}`, fn[name]);
        }
    }

    if (tag) {
        for (const name in tag) {
            tagMap.set(`${ns}:${name}`, tag[name]);
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
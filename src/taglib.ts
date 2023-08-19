import {toXML} from "to-xml";

export const nspAddTagLib = (app: NSP.App, tagLibDef: NSP.TagLibDef): void => {
    const {fnMap, tagMap} = app;
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

export const nspTag = <A, T = any>(app: NSP.App, name: string, attr: A | NSP.AttrFn<A, T>, body: NSP.NodeFn<T>): NSP.NodeFn<T> => {
    const {tagMap, options} = app;

    const tagFn: NSP.TagFn<A, T> = tagMap.get(name) || defaultTagFn;

    const conf = options.conf[name];

    const attrFn: NSP.AttrFn<A, T> = !attr ? () => ({} as A) : (typeof attr !== "function") ? () => attr : (attr as NSP.AttrFn<A, T>);

    const tagDef: NSP.TagDef<A, T> = {name, app, conf, attr: attrFn, body};

    return tagFn(tagDef);
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
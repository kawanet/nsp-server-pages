import type {NSP} from "../index.js"

import {load, mount} from "./mount.js";
import {FileLoader, JsLoader, JspLoader} from "./loaders.js";
import {parseJSP} from "./parse-jsp.js";
import {catchFn} from "./catch.js";
import {bundle} from "./bundle.js";
import {addTagLib, prepareTag} from "./taglib.js";
import {concat} from "./concat.js";

export const createNSP = (options?: NSP.Options): NSP.App => new App(options);

class App implements NSP.App {
    loaders: NSP.LoaderFn[] = [];
    tagMap = new Map<string, NSP.TagFn<any>>();
    fnMap = new Map<string, (...args: any[]) => any>();
    options: NSP.Options;

    protected hooks = new Map<string, (...args: any[]) => any>;
    protected jsLoader: JsLoader;
    protected jspLoader: JspLoader;
    protected fileLoader: FileLoader;

    constructor(options?: NSP.Options) {
        this.options = options = Object.create(options || null);
        if (!options.vName) options.vName = "v";
        if (!options.nspName) options.nspName = "nsp";
        if (!options.storeKey) options.storeKey = "#nsp";
    }

    hook(type: string, fn: (...args: any[]) => any): void {
        this.hooks.set(type, fn);
    }

    process(type: string, ...args: any[]): any {
        const fn = this.hooks.get(type);
        if (fn) return fn.apply(null, args);
    }

    log(message: string): void {
        const logger = this.options.logger || console;
        logger.log(message);
    }

    concat(..._: NSP.Strings[]): string | Promise<string> {
        return concat(arguments);
    }

    fn(name: string): (...args: any[]) => any {
        const fn = this.fnMap.get(name);
        if (!fn) throw new Error(`Unknown function: ${name}`);
        return fn;
    }

    addTagLib(tagLibDef: NSP.TagLibDef): void {
        addTagLib(this, tagLibDef);
    }

    tag<A, T = any>(name: string, attr?: A | NSP.AttrFn<A, T>, ..._: NSP.Node<T>[]): NSP.NodeFn<T> {
        const bodyFn = bundle(arguments, 2);
        const tagFn = prepareTag(this, name, attr, bodyFn);
        return catchFn(this, tagFn);
    }

    bundle<T>(..._: NSP.Node<T>[]): NSP.NodeFn<T> {
        const fn = bundle(arguments);
        return catchFn(this, fn);
    }

    parse(src: string): NSP.Parser {
        return parseJSP(this, src);
    }

    mount(path: RegExp | string, fn: NSP.LoaderFn): void {
        return mount(this, path, fn);
    }

    load<T = any>(path: string): Promise<NSP.NodeFn<T>> {
        return load<T>(this, path);
    }

    loadJS<T = any>(file: string): Promise<NSP.NodeFn<T>> {
        const loader = this.jsLoader || (this.jsLoader = new JsLoader(this));
        return loader.load<T>(file);
    }

    loadJSP<T = any>(file: string): Promise<NSP.NodeFn<T>> {
        const loader = this.jspLoader || (this.jspLoader = new JspLoader(this));
        return loader.load<T>(file);
    }

    loadFile<T = any>(file: string): Promise<NSP.NodeFn<T>> {
        const loader = this.fileLoader || (this.fileLoader = new FileLoader(this));
        return loader.load<T>(file);
    }

    store<S>(context: any, key: string, initFn?: () => S): S {
        if ("object" !== typeof context && context == null) {
            throw new Error("Context must be an object");
        }

        const {storeKey} = this.options;
        const map = context[storeKey] || (context[storeKey] = new Map());

        let value = map.get(key);
        if (value == null) {
            value = initFn();
            map.set(key, value);
        }
        return value;
    }
}

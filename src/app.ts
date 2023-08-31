import type {NSP} from "../index.js";

import {load, mount} from "./mount.js";
import {FileLoader, JsLoader, JspLoader} from "./loaders.js";
import {JSP} from "./parser/jsp.js";
import {catchFn} from "./catch.js";
import {bundle} from "./bundle.js";
import {addTagLib, prepareTag} from "./taglib.js";
import {concat} from "./concat.js";
import {Store} from "./store.js";

export class App implements NSP.App {
    protected loaders: NSP.LoaderFn[] = [];
    protected tagMap = new Map<string, NSP.TagFn<any>>();
    protected fnMap = new Map<string, (...args: any[]) => any>();
    protected hooks = new Map<string, (...args: any[]) => any>();
    protected jsLoader: JsLoader;
    protected jspLoader: JspLoader;
    protected fileLoader: FileLoader;

    options: NSP.Options;

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
        if (fn) return fn.apply(this, args);
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
        addTagLib.call(this, tagLibDef);
    }

    tag<A, T = any>(name: string, attr?: A | NSP.AttrFn<A, T>, ..._: NSP.Node<T>[]): NSP.NodeFn<T> {
        const bodyFn = bundle(arguments, 2);
        const tagFn = prepareTag.call(this, name, attr, bodyFn);
        return catchFn(this, tagFn);
    }

    bundle<T>(..._: NSP.Node<T>[]): NSP.NodeFn<T> {
        const fn = bundle(arguments);
        return catchFn(this, fn);
    }

    parse(src: string): NSP.JspParser {
        return new JSP(this, src);
    }

    mount(path: RegExp | string, fn: NSP.LoaderFn): void {
        return mount.call(this, path, fn);
    }

    load<T = any>(path: string): Promise<NSP.NodeFn<T>> {
        return load.call(this, path);
    }

    loadJS<T = any>(file: string): Promise<NSP.NodeFn<T>> {
        const loader = (this.jsLoader ??= new JsLoader(this));
        return loader.load<T>(file);
    }

    loadJSP<T = any>(file: string): Promise<NSP.NodeFn<T>> {
        const loader = (this.jspLoader ??= new JspLoader(this));
        return loader.load<T>(file);
    }

    loadFile<T = any>(file: string): Promise<NSP.NodeFn<T>> {
        const loader = (this.fileLoader ??= new FileLoader(this));
        return loader.load<T>(file);
    }

    store<P>(context: any, key: string): NSP.StackStore<P> {
        if ("object" !== typeof context && context == null) {
            throw new Error("Context must be an object");
        }

        const {storeKey} = this.options;
        const map = (context[storeKey] ??= new Map()) as Map<string, Store<any>>;

        let value: Store<P> = map.get(key);
        if (value == null) {
            value = new Store<P>();
            map.set(key, value);
        }
        return value;
    }
}

import {load, mount} from "./mount.js";
import {FileLoader, JsLoader, JspLoader} from "./loaders.js";
import {parseJSP} from "./parse-jsp.js";
import {nspCatch} from "./nsp-catch.js";
import {nspBundle} from "./nsp-bundle.js";
import {nspAddTagLib, nspTag} from "./taglib.js";
import {nspConcat} from "./nsp-concat.js";

export const createNSP = (options?: NSP.Options): NSP.App => new App(options);

class App implements NSP.App {
    loaders: NSP.LoaderFn[] = [];
    tagMap = new Map<string, NSP.TagFn<any>>();
    fnMap = new Map<string, (...args: any[]) => any>();
    options: NSP.Options;

    protected listeners = new Map<string, Function>;
    protected jsLoader: JsLoader;
    protected jspLoader: JspLoader;
    protected fileLoader: FileLoader;

    constructor(options?: NSP.Options) {
        this.options = options = Object.create(options || null);
        if (!options.conf) options.conf = {};
        if (!options.vKey) options.vKey = "v";
        if (!options.nspKey) options.nspKey = "nsp";
    }

    on(type: string, fn: any): void {
        this.listeners.set(type, fn);
    }

    emit(type: string, arg: any): any {
        const fn = this.listeners.get(type);
        if (fn) return fn(arg);
    }

    log(message: string): void {
        const logger = this.options.logger || console;
        logger.log(message);
    }

    concat(..._: (string | Promise<string>)[]): string | Promise<string> {
        return nspConcat(arguments);
    }

    fn(name: string): (...args: any[]) => any {
        const fn = this.fnMap.get(name);
        if (!fn) throw new Error(`Unknown function: ${name}`);
        return fn;
    }

    addTagLib(tagLibDef: NSP.TagLibDef): void {
        nspAddTagLib(this, tagLibDef);
    }

    tag<A, T = any>(name: string, attr?: A | NSP.AttrFn<A, T>, ..._: NSP.Node<T>[]): NSP.NodeFn<T> {
        const bodyFn = nspBundle(arguments, 2);
        const tagFn = nspTag(this, name, attr, bodyFn);
        return nspCatch(this, tagFn);
    }

    bundle<T>(..._: NSP.Node<T>[]): NSP.NodeFn<T> {
        const fn = nspBundle(arguments);
        return nspCatch(this, fn);
    }

    parse(src: string): NSP.Parser {
        return parseJSP(this, src);
    }

    mount(match: RegExp | string, fn: NSP.LoaderFn): void {
        return mount(this, match, fn);
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
}

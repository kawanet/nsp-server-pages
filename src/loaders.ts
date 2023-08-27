import {queueFactory} from "async-cache-queue";
import {promises as fs} from "fs";

import type {NSP} from "../index.js";

const getName = (path: string) => path.split("/").at(-1)?.split(".").at(0) || "";

abstract class BaseLoader {
    protected appRef: WeakRef<NSP.App>;
    /**
     * This tests the file exists.
     * The test cache is separated from the loader cache to avoid cache flushed by dirty requests.
     */
    protected isFile = queueFactory({
        cache: 60 * 1000,
        maxItems: 10 * 1000,
        negativeCache: 1000,
        timeout: 1000,
    })(async (file: string) => {
        return await fs.stat(file).then(stat => stat?.isFile()).catch(() => false);
    });

    constructor(app: NSP.App) {
        this.appRef = new WeakRef(app);
    }

    /**
     * Load a file and return a function.
     */
    abstract load<T>(file: string): Promise<NSP.NodeFn<T>>;
}

export class JspLoader extends BaseLoader {
    /**
     * Parse JSP file, cache the result function and return it.
     */
    private _load = queueFactory({
        cache: 60 * 1000,
        maxItems: 10 * 1000,
        negativeCache: 1000,
        timeout: 1000,
    })(async <T>(path: string): Promise<NSP.NodeFn<T>> => {
        const app = this.appRef.deref();
        app.log(`loading: ${path}`);
        const text = await fs.readFile(path, "utf8");
        return app.parse(text).toFn<T>();
    });

    async load<T>(file: string): Promise<NSP.NodeFn<T>> {
        // valid only for .jsp files
        if (!/\.jsp$/.test(file)) return;

        // skip when file does not exist
        if (!await this.isFile(file)) return;

        // load .jsp file then
        return this._load(file);
    }
}

export class JsLoader extends BaseLoader {
    /**
     * Parse JS file, cache the result function and return it.
     */
    private _load = queueFactory({
        cache: 60 * 1000,
        maxItems: 1000,
        negativeCache: 1000,
        timeout: 1000,
    })(async <T>(file: string): Promise<NSP.NodeFn<T>> => {
        const app = this.appRef.deref();

        app.log(`loading: ${file}`);
        const module = await import(file);
        const name = getName(file);

        const fn: ((nsp: NSP.App) => NSP.NodeFn<T>) = module[name];
        if (typeof fn !== "function") {
            throw new Error(`Named export "${name}" not found in module: ${file}`);
        }

        const nodeFn = fn(app);
        if (typeof nodeFn !== "function") {
            throw new Error(`Exported "${name}" function does not returns a valid function: ${file}`);
        }

        return nodeFn;
    });

    async load<T>(file: string): Promise<NSP.NodeFn<T>> {
        file = file?.replace(/\.jsp$/, ".js");

        // valid only for .js files
        if (!/\.[cm]?js$/.test(file)) return;

        // skip when file does not exist
        if (!await this.isFile(file)) return;

        // import .js file then
        return this._load(file);
    }
}

export class FileLoader extends BaseLoader {
    /**
     * Parse HTML or other text files, cache the result function and return it.
     */
    private _load = queueFactory({
        cache: 60 * 1000,
        maxItems: 1000,
        negativeCache: 1000,
        timeout: 1000,
    })(async <T>(file: string): Promise<NSP.NodeFn<T>> => {
        const app = this.appRef.deref();
        app.log(`loading: ${file}`);
        const text = await fs.readFile(file, "utf8");
        return () => text;
    });

    async load<T>(file: string): Promise<NSP.NodeFn<T>> {
        // disabled for JSP, JS and image files
        if (/\.(jsp|[cm]?js|png|gif|jpe?g)$/i.test(file)) return;

        // skip when file does not exist
        if (!await this.isFile(file)) return;

        // load HTML and other text files then
        return this._load(file);
    }
}

/**
 * nsp-server-pages
 *
 * @see https://github.com/kawanet/nsp-server-pages
 */

export const createNSP: (options?: NSP.Options) => NSP.App;

declare namespace NSP {
    type NodeFn<T> = (context: T) => string | Promise<string>;

    type Node<T> = string | NodeFn<T>;

    type AttrFn<A, T = any> = (context: T) => A;

    type VoidFn<T> = (context: T) => void | Promise<void>;

    type TagFn<A, T = any> = (tag: TagDef<A, T>) => (NodeFn<T> | VoidFn<T>);

    type LoaderFn = (path: string) => Promise<NodeFn<any> | undefined>;

    type Strings = string | Promise<string> | Strings[];

    type Build<T> = (nsp: App) => (context: T) => string | Promise<string>;

    interface TagDef<A, T = any> {
        app: App;
        name: string;
        attr: AttrFn<A, T>;
        body: NodeFn<T>;
    }

    interface Options {
        logger?: { log: (message: string) => void };

        /**
         * variable name for context
         * @default "v"
         */
        vName?: string;

        /**
         * variable name for App instance
         * @default "nsp"
         */
        nspName?: string;

        /**
         * property name for data store in context
         * @default "#nsp"
         */
        storeKey?: string;

        /**
         * indent size for JavaScript source generated
         * @default 0
         */
        indent?: number;

        /**
         * add comments at toJS() result
         * @default false
         */
        comment?: boolean;

        /**
         * set false not to remove edge spaces in HTML in some cases.
         * @default true
         */
        trimSpaces?: boolean;

        /**
         * set true to keep EL result value of `null` and `undefined` as is.
         * @default false
         */
        nullish?: boolean;

        /**
         * expression filter before transpile starts
         */
        prefilter?: (src: string) => string;

        /**
         * expression filter after transpile done
         */
        postfilter?: (src: string) => string;
    }

    interface App {
        fnMap: Map<string, (...args: any[]) => any>;
        loaders: LoaderFn[];
        options: Options;
        tagMap: Map<string, TagFn<any>>;

        /**
         * register a tag library
         */
        addTagLib(tagLibDef: TagLibDef): void;

        /**
         * build a NodeFn which returns a string for the content nodes
         */
        bundle<T>(...nodes: Node<T>[]): NodeFn<T>;

        /**
         * concat strings even if they are Promise<string>
         */
        concat(...text: Strings[]): string | Promise<string>;

        /**
         * retrieve a result from hook function
         */
        process<R>(type: string, ...args: any[]): R;

        /**
         * pickup the taglib function
         */
        fn(name: string): (...args: any[]) => any;

        /**
         * load a NodeFn for the path mounted by mount()
         */
        load<T>(path: string): Promise<NodeFn<T>>;

        /**
         * load a NodeFn for the local filesystem path
         */
        loadFile<T>(file: string): Promise<NodeFn<T>>;

        loadJS<T>(file: string): Promise<NodeFn<T>>;

        loadJSP<T>(file: string): Promise<NodeFn<T>>;

        /**
         * log a message via options.logger which defaults console.log
         */
        log(message: string): void;

        /**
         * mount a loader function for the path matched
         */
        mount(path: RegExp | string, fn: LoaderFn): void;

        /**
         * register a hook function
         */
        hook(type: "error", fn: (e: Error, context?: any) => string | void): void;

        hook(type: "directive", fn: (src: string, context?: any) => string | void): void;

        hook(type: "declaration", fn: (src: string, context?: any) => string | void): void;

        hook(type: "scriptlet", fn: (src: string, context?: any) => string | void): void;

        hook(type: string, fn: (...args: any[]) => any): void;

        /**
         * parse a JSP document
         */
        parse(src: string): Parser;

        /**
         * get a private data store in context
         */
        store<P>(context: any, key: string): StackStore<P>;

        /**
         * generates a NodeFn for the tag
         */
        tag<A, T = any>(name: string, attr?: A | AttrFn<A, T>, ...body: Node<T>[]): NodeFn<T>;
    }

    interface TagLibDef {
        /**
         * namespace
         */
        ns: string;

        /**
         * functions
         */
        fn?: { [name: string]: (...args: any[]) => any };

        /**
         * tags
         */
        tag?: { [name: string]: TagFn<any> };
    }

    interface StackStore<P> {
        /**
         * set value to the store
         */
        set(value: P): void;

        /**
         * get value from the store
         */
        get(): P;

        /**
         * open a new layer
         */
        open(value?: P): void;

        /**
         * close the current layer
         */
        close(): P;

        /**
         * find a value from layers with the test function
         */
        find(test: (data: P) => boolean): P;
    }

    interface ToJSOption {
        indent?: number;
    }

    /**
     * Parser for JSP document
     */
    interface Parser {
        /**
         * transpile the JSP document to JavaScript source code
         */
        toJS(option?: ToJSOption): string;

        /**
         * compile the JSP document as a NodeFn
         */
        toFn<T>(): NodeFn<T>;
    }
}

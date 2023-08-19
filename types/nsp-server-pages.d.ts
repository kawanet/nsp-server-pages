/**
 * nsp-server-pages
 *
 * @see https://github.com/kawanet/nsp-server-pages
 */

declare namespace NSP {
    type NodeFn<T> = (context?: T) => string | Promise<string>;

    type Node<T> = string | NodeFn<T>;

    type AttrFn<A, T = any> = (context?: T) => A;

    type TagFn<A, T = any> = (tag: TagDef<A, T>) => NodeFn<T>;

    type LoaderFn = (path: string) => Promise<NSP.NodeFn<any>>;

    interface TagDef<A, T = any> {
        app: NSP.App;
        conf: any;
        name: string;
        attr: AttrFn<A, T>;
        body: NodeFn<T>;
    }

    interface Options {
        logger?: { log: (message: string) => void };

        /**
         * tag configuration
         */
        conf?: { [tagName: string]: any };

        /**
         * variable name for context
         */
        vKey?: string;

        /**
         * variable name for NSP.App instance
         */
        nspKey?: string;

        /**
         * indent size for JavaScript source generated
         */
        indent?: number;

        /**
         * add comments at toJS() result
         */
        comment?: boolean;

        /**
         * remove edge spaces in HTML in some cases
         */
        trimSpaces?: boolean;

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

        addTagLib(tagLibDef: TagLibDef): void;

        bundle<T>(...node: Node<T>[]): NodeFn<T>;

        concat(...text: (string | Promise<string>)[]): string | Promise<string>;

        emit<T>(type: "error", e: Error, context?: T): string;

        emit<T>(type: "directive", src: string, context?: T): string;

        emit<T>(type: "declaration", src: string, context?: T): string;

        emit<T>(type: "scriptlet", src: string, context?: T): string;

        fn(name: string): (...args: any[]) => any;

        load<T>(path: string): Promise<NSP.NodeFn<T>>;

        loadFile<T>(file: string): Promise<NSP.NodeFn<T>>;

        loadJS<T>(file: string): Promise<NSP.NodeFn<T>>;

        loadJSP<T>(file: string): Promise<NSP.NodeFn<T>>;

        log(message: string): void;

        mount(match: RegExp | string, fn: LoaderFn): void;

        on(type: "error", fn: <T>(e: Error, context?: T) => string | void): void;

        on(type: "directive", fn: <T>(src: string, context?: T) => string | void): void;

        on(type: "declaration", fn: <T>(src: string, context?: T) => string | void): void;

        on(type: "scriptlet", fn: <T>(src: string, context?: T) => string | void): void;

        parse(src: string): Parser;

        tag<A, T = any>(name: string, attr?: A | AttrFn<A, T>, ...body: Node<T>[]): NodeFn<T>;
    }

    interface TagLibDef {
        ns: string;

        fn?: { [name: string]: (...args: any[]) => any };

        tag?: { [name: string]: TagFn<any> };
    }

    interface ToJSOption {
        indent?: number;
    }

    /**
     * Parser for JSP document
     */
    interface Parser {
        toJS(option?: ToJSOption): string;

        toFn<T>(): NodeFn<T>;
    }
}

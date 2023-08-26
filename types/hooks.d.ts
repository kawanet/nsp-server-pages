type RuntimeErrorHookType = "error";

type RuntimeScriptletHookTypes =
    "directive"
    | "declaration"
    | "expression"
    | "scriptlet";

type BeforeParseHookTypes =
    "before.parse.attr"
    | "before.parse.comment"
    | "before.parse.declaration"
    | "before.parse.directive"
    | "before.parse.el"
    | "before.parse.expression"
    | "before.parse.jsp"
    | "before.parse.text";

type ParseHookTypes =
    "parse.attr"
    | "parse.comment"
    | "parse.declaration"
    | "parse.directive"
    | "parse.el"
    | "parse.expression"
    | "parse.jsp"
    | "parse.text";

type AfterParseHookTypes =
    "after.parse.attr"
    | "after.parse.comment"
    | "after.parse.declaration"
    | "after.parse.directive"
    | "after.parse.el"
    | "after.parse.expression"
    | "after.parse.jsp"
    | "after.parse.text";

type KnownHookTypes =
    RuntimeErrorHookType
    | RuntimeScriptletHookTypes
    | BeforeParseHookTypes
    | ParseHookTypes
    | AfterParseHookTypes;

export interface Hooks {
    /**
     * ==== RUNTIME HOOKS ====
     *
     * hook called when an Error thrown.
     * return a string to output the error message and cancel the exception.
     * return undefined to stop the page with the exception.
     */
    hook(type: RuntimeErrorHookType, fn: (e: Error, context: any) => string | void): void;

    /**
     * hooks called with JSP directive, declaration, scriptlet on runtime.
     */
    hook(type: RuntimeScriptletHookTypes, fn: (src: string, context: any) => string | void): void;

    /**
     * ==== TRANSPILER HOOKS ====
     *
     * hooks called with input JSP document before transpiling started.
     * return a string to modify the input.
     * return undefined not to modify the input.
     */
    hook(type: BeforeParseHookTypes, fn: (src: string) => string | void): void;

    /**
     * hooks called with JSP document to replace our default transpiler.
     * return a string if you have own transpiler for the type.
     * return undefined for our default transpiler to work.
     */
    hook(type: ParseHookTypes, fn: (src: string) => string | void): void;

    /**
     * hooks called with output JavaScript code after transpiling done.
     * return a string to modify the output.
     * return undefined not to modify the output.
     */
    hook(type: AfterParseHookTypes, fn: (src: string) => string | void): void;

    /**
     * ==== OTHER HOOKS ====
     */
    hook(type: Exclude<string, KnownHookTypes>, fn: (...args: any[]) => any): void;
}

import {App} from "./src/app.js";
import type * as types from "./types/index.js";

export type {NSP} from "./types/index.js";

export const createNSP: typeof types.createNSP = (options) => new App(options);

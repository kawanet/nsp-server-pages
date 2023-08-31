import type {NSP} from "../types/index.js";

/**
 * The Store class was implemented using a stack {stack: P[]} at first.
 * Now it was changed to a linked list to allow access to the parent.
 */
export class Store<P> implements NSP.StackStore<P> {
    item: Item<P>;

    constructor(value?: P) {
        this.item = {value} as Item<P>;
    }

    open(value?: P): void {
        this.item = {parent: this.item, value};
    }

    close(): P {
        const item = this.item;
        this.item = item.parent;
        return item.value;
    }

    get(): P {
        return this.item.value;
    }

    set(value: P): void {
        this.item.value = value;
    }

    find(test: (data: P) => boolean): P {
        let item = this.item;

        while (item) {
            if (test(item.value)) {
                return item.value;
            }
            item = item.parent;
        }
    }
}

interface Item<P> {
    parent: Item<P>;
    value: P;
}

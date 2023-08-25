export class StackStore<P> implements StackStore<P> {
    protected stack: P[] = [];

    constructor(value?: P) {
        if (arguments.length) {
            this.set(value);
        }
    }

    open(value?: P): void {
        this.stack.unshift(value);
    }

    close(): P {
        return this.stack.shift();
    }

    get(): P {
        return this.stack[0];
    }

    set(value: P): void {
        this.stack[0] = value;
    }

    find(test: (data: P) => boolean): P {
        for (const data of this.stack) {
            if (test(data)) {
                return data;
            }
        }
    }
}

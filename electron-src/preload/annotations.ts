import "reflect-metadata";

export function validate(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const impl = descriptor.value! as Function;
    const types = Reflect.getMetadata("design:paramtypes", target, propertyKey);

    descriptor.value = function (): any {
        if (arguments.length !== types.length) {
            throw new TypeError(`Invalid number of arguments, got ${types.length} not ${arguments.length}`);
        }

        for (let i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] !== types[i].name.toLowerCase()) {
                throw new TypeError(`Invalid type at position ${i}, expected ${types[i].name}, got ${typeof arguments[i]}`);
            }
        }

        return impl.apply(this, arguments);
    };
}

export function sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
}
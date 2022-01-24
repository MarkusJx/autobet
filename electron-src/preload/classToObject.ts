type Object<T> = {
    [key in keyof Omit<T, "constructor" | "prototype" | "length" | "name">]: T[key];
};

export default function classToObject<T extends Object<T>>(cls: T): Object<T> {
    const keys = Reflect.ownKeys(cls);
    const obj: Object<T> = Object.create({});

    keys.forEach(key => {
        if (key === "constructor" || key === "length" || key === "name" || key === "prototype") return;
        Object.defineProperty(obj, key, {
            value: cls[key as keyof T],
            enumerable: true,
            configurable: false,
            writable: false
        });
    });

    return obj;
}
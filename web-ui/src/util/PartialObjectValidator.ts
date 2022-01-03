export default class PartialObjectValidator {
    private constructor() {
    }

    public static validate<T extends {}>(obj: T): Required<T> {
        for (let key in obj) {
            if (!obj[key]) {
                throw new TypeError(`The value of key '${key}' was undefined`);
            } else if (typeof obj[key] === "object") {
                obj[key] = PartialObjectValidator.validate(obj[key]) as any;
            }
        }

        return obj as Required<T>;
    }
}
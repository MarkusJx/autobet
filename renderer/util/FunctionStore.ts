export class FunctionStore {
    /**
     * The function name
     */
    name: string;

    /**
     * The function script string
     */
    functionString: string;

    /**
     * Whether this implementation is valid
     */
    ok: boolean;

    /**
     * Whether this is the active implementation
     */
    active: boolean;

    /**
     * The last error string
     */
    lastError: string;

    /**
     * The function id
     */
    id: string;

    /**
     * Construct a functionStore
     *
     * @param name the function name
     * @param fnString the function string
     * @param id the function id
     */
    constructor(name: string, fnString: string, id: string) {
        this.name = name;
        this.functionString = fnString;
        this.ok = false;
        this.active = false;
        this.lastError = "";
        this.id = id;
    }
}
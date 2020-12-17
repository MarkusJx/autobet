export class functionStore {
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
     */
    constructor(name: string, fnString: string, id: string);
}
export class functionStore {
    /**
     * Construct a functionStore
     * 
     * @param name the function name
     * @param fnString the function string
     */
    constructor(name: string, fnString: string);

    setFunctionString(fn: string): void;

    /**
     * Get the function string
     * 
     * @returns the function string
     */
    getFunctionString(): string;

    /**
     * Check if this function is the active betting function
     * 
     * @returns true, if it is active
     */
    isActive(): boolean;

    /**
     * Set this as the active betting function - or not
     * 
     * @param val true, if this should be the active betting function
     */
    setActive(val: boolean): void;

    /**
     * Get the function name
     * 
     * @returns the function name
     */
    getFunctionName(): string;

    /**
     * Set the function name
     * 
     * @param n the function name
     */
    setFunctionName(n: string): void;

    /**
     * Check if this function is a valid betting function
     * 
     * @returns true, if this function is valid
     */
    isOk(): boolean;

    /**
     * Set if this function is valid
     * 
     * @param val whether the function is valid
     */
    setOk(val: boolean): void;

    /**
     * Get the last error
     * 
     * @returns the last error string
     */
    getLastError(): string;

    /**
     * Set the last error
     * 
     * @param val the error string
     */
    setLastError(val: string): void;
}
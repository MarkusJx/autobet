import { VM } from 'vm2';

/**
 * The type of odds
 */
export type odds_type = {
    /**
     * Every odd between evens and 5/1 inclusive
     */
    lower: string[],
    /**
     * Every odd between 6/1 and 30/1
     */
    upper: string[]
};

/**
 * A test result
 */
export type test_res = {
    /**
     * The odds used to call the function
     */
    odds: string[],
    /**
     * The result of the function
     */
    result: string
};

/**
 * An error result
 */
export type err_res = {
    /**
     * The error message
     */
    error: string,
    /**
     * The stack trace
     */
    stack: string
};

/**
 * A test result array
 */
export type test_res_arr = test_res[];

/**
 * A test result containing an actual result or an error
 */
export type testResult = {
    /**
     * True, if the test was successful
     */
    ok: boolean,
    /**
     * The test result if if the test was successful
     * or an error result if the test was not successful
     */
    res: err_res | test_res_arr
};

/**
 * An isolated function
 */
export class isolatedFunction {
    /**
     * Set to true, if a vm is already running
     */
    running: boolean;

    /**
     * The result of an vm run
     */
    result: string;

    /**
     * The function to run in a vm
     */
    function: string;

    /**
     * The vm to use
     */
    vm: VM;

    /**
     * Create an isolated function
     */
    constructor();

    /**
     * Set the script to run
     * 
     * @param func a script
     */
    setFunction(func: string): void;

    /**
     * Run the isolated function
     * 
     * @param odds the odds argument
     * @returns the result of the operation or nothing if no bet should be placed
     */
    run(odds: string[]): string | null | undefined;

    /**
     * Test the supplied function
     * 
     * @param maxTests the maximum number of tests to run
     * @returns the rest result
     */
    testFunction(maxTests = 10): testResult;
}
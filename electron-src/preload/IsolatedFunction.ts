import {ExternalCopy, Isolate} from "isolated-vm";
import {Mutex} from "async-mutex";
import deasync from "deasync";

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
 * Every odd in existence
 */
const odds: odds_type = {
    lower: ["evens", "2/1", "3/1", "4/1", "5/1"],
    upper: [
        "6/1", "7/1", "8/1", "9/1", "10/1", "12/1",
        "13/1", "14/1", "15/1", "16/1", "17/1", "18/1",
        "19/1", "20/1", "21/1", "22/1", "23/1", "24/1",
        "25/1", "26/1", "27/1", "28/1", "29/1", "30/1"
    ]
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
    result: string | null
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
    stack: string,
    /**
     * The data used to produce this error
     */
    data: test_res_arr | null
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
     * The test result if the test was successful
     * or an error result if the test was not successful
     */
    res: err_res | test_res_arr
};

/**
 * An isolated function
 */
export default class IsolatedFunction {
    public readonly runSync: (odds: string[]) => (string | null);

    /**
     * The function to run in a vm
     * @private
     */
    private func: string | null;
    /**
     * Set to true, if a vm is already running
     * @private
     */
    private readonly mutex: Mutex = new Mutex();
    /**
     * The vm to use
     * @private
     */
    private readonly isolate: Isolate;

    /**
     * Create an isolated function
     *
     * @param loggingFunction the logging function callback
     */
    public constructor(private readonly loggingFunction: (msg: string) => void = console.log) {
        this.func = null;
        this.isolate = new Isolate({
            memoryLimit: 128
        });

        this.runSync = deasync((odds: string[], callback: (err: any, res: string | null) => void): void => {
            this.run(odds).then((res: string | null): void => {
                callback(undefined, res);
            }, (err: any): void => {
                callback(err, null);
            });
        });
    }

    /**
     * Set the script to run
     *
     * @param func a script
     */
    public setFunction(func: string): Promise<void> {
        return this.mutex.runExclusive(() => {
            this.func = func;
        });
    }

    /**
     * Run the isolated function
     *
     * @param odds the odds argument
     * @returns the result of the operation or nothing if no bet should be placed
     */
    public async run(odds: string[]): Promise<string | null> {
        if (!this.func || typeof this.func !== "string") {
            throw new Error("The function is not set");
        }

        return await this.mutex.runExclusive(async () => {
            const context = await this.isolate.createContext();
            const jail = context.global;

            await jail.set('odds', new ExternalCopy(odds).copyInto());
            await jail.set('log', this.loggingFunction.bind(this));

            const script = await this.isolate.compileScript(this.func!);
            return await script.run(context, {
                timeout: 5000
            });
        });
    }

    /**
     * Test the supplied function
     *
     * @param maxTests the maximum number of tests to run
     * @returns the rest result
     */
    public async testFunction(maxTests: number = 10): Promise<testResult> {
        /**
         * Generate an odds array
         *
         * @returns a random odds array
         */
        function generateOdds(): string[] {
            /**
             * Get a random (whole) integer.
             * The maximum is exclusive and the minimum is inclusive.
             * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
             *
             * @param min the minimum value
             * @param max the maximum value
             * @returns the random integer min <= i < max
             */
            function getRandomInt(min: number, max: number): number {
                min = Math.ceil(min);
                max = Math.floor(max);
                //The maximum is exclusive and the minimum is inclusive
                return Math.floor(Math.random() * (max - min) + min);
            }

            /**
             * Count the number of occurrences of an object in an array
             *
             * @param arr the array the object may be in
             * @param val the value to search for or count
             * @returns the number of occurrences
             */
            function count<T>(arr: T[], val: T): number {
                let c: number = 0;
                for (let i: number = 0; i < arr.length; i++) {
                    if (arr[i] === val) c++;
                }

                return c;
            }

            /**
             * The result array
             */
            const res: (string | null)[] = [null, null, null, null, null, null];

            // Generate random lower odds evens <= o <= 5/1
            const l1: string = odds.lower[getRandomInt(0, odds.lower.length)];
            const l2: string = odds.lower[getRandomInt(0, odds.lower.length)];

            // Set the lower odds to random positions in the result array
            res[getRandomInt(0, res.length)] = l1;
            let cur: number = getRandomInt(0, odds.lower.length);

            // As long as res[cur] == l1, set cur to a new random number
            while (res[cur] != null) {
                cur = getRandomInt(0, odds.lower.length);
            }

            // Set the second lower odd
            res[cur] = l2;

            // Set the higher odds
            for (let i: number = 0; i < 4; i++) {
                // Generate a random upper odd
                let rnd: string = odds.upper[getRandomInt(0, odds.upper.length)];

                // While the count of rnd >= 2, generate a new random upper odd
                while (count(res, rnd) >= 2) {
                    rnd = odds.upper[getRandomInt(0, odds.upper.length)];
                }

                // Push rnd to res
                for (let j: number = 0; j < res.length; j++) {
                    if (res[j] == null) {
                        res[j] = rnd;
                        break;
                    }
                }
            }

            // Return the result
            return res as string[];
        }

        /**
         * The values array
         */
        const values: test_res_arr = [];

        // Run the test maxTests times
        for (let i: number = 0; i < maxTests; i++) {
            // Generate random odds
            const o: string[] = generateOdds();
            try {
                // Run the function with o
                let r: string | null = await this.run(o);

                if (typeof r === "string") {
                    // Basic xss protection
                    r = r.replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&#34;");
                }

                // Push the result of the call to values
                values.push({
                    odds: o,
                    result: r
                });

                if (r === undefined) {
                    throw new Error("The test run returned undefined");
                } else if (r !== null) {
                    if (typeof r !== "string") {
                        throw new Error(`The result did not return a string, it returned type ${typeof r}`);
                    } else if (!o.includes(r)) {
                        throw new Error(`The test run returned a result which is not a member of odds: ${r}`);
                    }
                }
            } catch (e: any) {
                // Return the error result
                return {
                    ok: false,
                    res: {
                        error: e.toString(),
                        stack: e.stack,
                        data: values
                    }
                };
            }
        }

        // Return the result
        return {
            ok: true,
            res: values
        };
    }
}
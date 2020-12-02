const { VM } = require('vm2');

/**
 * The type of odds
 * @typedef {{
 * lower: string[],
 * upper: string[]
 * }} odds_type
 */

/**
 * Every odd in existance
 * 
 * @type {odds_type}
 */
const odds = {
    lower: ["evens", "2/1", "3/1", "4/1", "5/1"],
    upper: [
        "6/1", "7/1", "8/1", "9/1", "10/1", "12/1",
        "13/1", "14/1", "15/1", "16/1", "17/1", "18/1",
        "19/1", "20/1", "21/1", "22/1", "23/1", "24/1",
        "25/1", "26/1", "27/1", "28/1", "29/1", "30/1"
    ]
};

module.exports = {
    /**
     * A test result
     * @typedef {{
     * odds: string[],
     * result: string
     * }} test_res
     */

    /**
     * An error result
     * @typedef {{
     * error: string,
     * stack: string
     * }} err_res
     */

    /**
     * A test result array
     * @typedef {test_res[]} test_res_arr
     */

    /**
     * A test result containing an actual result or an error
     * @typedef {{
     * ok: boolean,
     * res: err_res | test_res_arr
     * }} testResult
     */

    /**
     * An isolated function
     */
    isolatedFunction: class {
        /**
         * Create an isolated function
         */
        constructor() {
            this.running = false;
            this.result = null;
            this.function = null;
            this.vm = new VM({
                timeout: 5000,
                compiler: "javascript",
                eval: false,
                wasm: false,
                fixAsync: true,
                sandbox: {
                    log: console.log,
                    setResult: (res) => {
                        this.result = res;
                    }
                }
            });
        }

        /**
         * Set the script to run
         * 
         * @param {string} func a script
         */
        setFunction(func) {
            this.function = func;
        }

        /**
         * Run the isolated function
         * 
         * @param {string} odds the odds argument
         * @returns {string | null | undefined} the result of the operation or nothing if no bet should be placed
         */
        run(odds) {
            if (typeof this.function !== "string") {
                throw new Error("The function is not set");
            }

            // Basic synchronization
            while (this.running);
            this.running = true;

            // Initialize the result
            this.result = null;

            // Set the odds and run the function
            this.vm.setGlobal("odds", odds);
            this.vm.run(this.function);

            // Get the result and set this.result to null
            const res = this.result;
            this.result = null;
            this.running = false;
            return res;
        }

        /**
         * Test the supplied function
         * 
         * @param {number} maxTests the maximum number of tests to run
         * @returns {testResult} the rest result
         */
        testFunction(maxTests = 10) {
            /**
             * Generate an odds array
             * 
             * @returns {string[]} a random odds array
             */
            function generateOdds() {
                /**
                 * Get a random (whole) integer.
                 * The maximum is exclusive and the minimum is inclusive.
                 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
                 * 
                 * @param {number} min the minimum value
                 * @param {number} max the maximum value
                 * @returns {number} the random integer min <= i < max
                 */
                function getRandomInt(min, max) {
                    min = Math.ceil(min);
                    max = Math.floor(max);
                    //The maximum is exclusive and the minimum is inclusive
                    return Math.floor(Math.random() * (max - min) + min);
                }

                /**
                 * Count the number of occurences of an object in an array
                 * 
                 * @template T
                 * @param {T[]} arr the array the object may be in
                 * @param {T} val the value to search for or count
                 * @returns {number} the number of occurences
                 */
                function count(arr, val) {
                    let c = 0;
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i] == val) c++;
                    }

                    return c;
                }

                /**
                 * The result array
                 * @type {string[]}
                 */
                const res = [null, null, null, null, null, null];

                // Generate random lower odds evens <= o <= 5/1
                const l1 = odds.lower[getRandomInt(0, odds.lower.length)];
                const l2 = odds.lower[getRandomInt(0, odds.lower.length)];

                // Set the lower odds to random positions in the result array
                res[getRandomInt(0, res.length)] = l1;
                let cur = getRandomInt(0, odds.lower.length);

                // As long as res[cur] == l1, set cur to a new random number
                while (res[cur] != null) {
                    cur = getRandomInt(0, odds.lower.length);
                }

                // Set the second lower odd
                res[cur] = l2;

                // Set the higher odds
                for (let i = 0; i < 4; i++) {
                    // Generate a random upper odd
                    let rnd = odds.upper[getRandomInt(0, odds.upper.length)];

                    // While the count of rnd >= 2, generate a new random upper odd
                    while (count(res, rnd) >= 2) {
                        rnd = odds.upper[getRandomInt(0, odds.upper.length)];
                    }

                    // Push rnd to res
                    for (let j = 0; j < res.length; j++) {
                        if (res[j] == null) {
                            res[j] = rnd;
                            break;
                        }
                    }
                }

                // Return the result
                return res;
            }

            /**
             * The values array
             * @type {test_res_arr}
             */
            const vals = [];

            // Run the test maxTests times
            for (let i = 0; i < maxTests; i++) {
                // Generate random odds
                const o = generateOdds();
                try {
                    // Run the function with o
                    const r = this.run(o);

                    // Push the result of the call to vals
                    vals.push({
                        odds: o,
                        result: r
                    });
                } catch (e) {
                    // Return the error result
                    return {
                        ok: false,
                        res: {
                            error: e.toString(),
                            stack: e.stack
                        }
                    };
                }
            }

            // Return the result
            return {
                ok: true,
                res: vals
            };
        }
    }
};
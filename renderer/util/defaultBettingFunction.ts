const defaultBettingFunction: string = `// A js implementation of the native implementation may look like this:

// Convert an odd string such as '2/1'
// to a number, e.g. 2
function toNumber(val) {
    return Number(val.split('/')[0]);
}

// Main function
// Returns string, the odd of the horse to bet on,
// or null, if no bet should be placed
function run() {
    let containsEvens = odds.includes("evens");
    let lowest = null;

    for (let i = 0; i < odds.length; i++) {
        // Check if one probability >= 5/1 exists multiple times
        for (let j = i + 1; j < odds.length; j++) {
            // If odds[i] >= 5/1 exists multiple times, do not bet
            if ((odds[i] == "evens" || toNumber(odds[i]) <= 5) && odds[i] == odds[j])
                return null;
        }

        // If odds contains 'evens' and does also
        // contain another one >= 3/1, do not bet
        if (containsEvens && (odds[i] == "2/1" || odds[i] == "3/1"))
            return null;

        // Set the lowest odd
        if (!containsEvens && (lowest == null || toNumber(odds[i]) < toNumber(lowest))) {
            lowest = odds[i];
        }
    }

    // If the odds contain evens, this is the lowest
    if (containsEvens) {
        lowest = "evens";
    }

    // Return the lowest odd
    return lowest;
}

// Set the result.
// Set null if no bet should be placed,
// the odd of the horse to bet on otherwise
setResult(run());
`;

export default defaultBettingFunction;
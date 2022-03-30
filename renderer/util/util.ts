import StaticInstances from "./StaticInstances";

/**
 * Make sums more readable by adding 'K' for thousand
 * or 'M' for million to the end of the sum
 *
 * @param sum the sum to make pretty
 * @param k whether to replace thousand by 'K'
 * @returns the resulting value in the format [-]$<0-999>.<0-99><B|M|K>
 */
export function makeSumsDisplayable(sum: number, k: boolean = false): string {
    const negative: boolean = sum < 0;
    sum = Math.abs(sum);

    let res: string;

    if (sum >= 1000000000) { // One billion
        res = (sum / 1000000000).toFixed(2) + "B";
    } else if (sum >= 1000000) { // One million
        res = (sum / 1000000).toFixed(2) + "M";
    } else if (k && sum >= 1000) { // One thousand
        res = (sum / 1000).toFixed(2) + "K";
    } else {
        res = String(sum);
    }

    // Optional: Convert gazillions

    if (negative) {
        return "-$" + res;
    } else {
        return "$" + res;
    }
}

export async function saveSettings(): Promise<void> {
    await window.autobet.settings.saveSettings();
    StaticInstances.settingsSavedAlert?.show(5000);
}
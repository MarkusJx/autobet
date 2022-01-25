import isDev from "electron-is-dev";
import packageJson from "../../package.json";

function check(): boolean {
    const rel_ver_regex: RegExp = /^([0-9]+\.)*[0-9]*$/;

    const enableDevTools = !rel_ver_regex.test(packageJson.version) || process.argv.includes("--enableDevTools") || isDev;
    console.log(`Starting with devTools ${enableDevTools ? "enabled" : "disabled"}`);
    return enableDevTools;
}

export default check();
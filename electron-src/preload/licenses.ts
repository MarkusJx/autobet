import path from "path";
import fs from "fs/promises";
import {validate} from "./annotations";
import classToObject from "./classToObject";
import autobetLib from "@autobet/autobetlib";

export interface LicenseInfo {
    name: string;
    id: number;
    files: LicenseFile[];
}

export interface LicenseFile {
    softwareName: string;
    name: string;
    path: string;
}

export interface CompleteLicenseFile extends LicenseFile {
    content: string;
}

const loadedLicenses: LicenseInfo[] = [];
const mainDirectory = path.join(__dirname, '..', '..', '..', '..');

class licenses {
    @validate
    public static getLicenses(): Promise<LicenseInfo[]> {
        return new Promise<LicenseInfo[]>(async (resolve) => {
            if (loadedLicenses.length <= 0) {
                let index: number = 0;

                // Insert the main license
                loadedLicenses.push({
                    name: "Autobet",
                    id: index++,
                    files: [{
                        softwareName: "Autobet",
                        name: "LICENSE",
                        path: path.join(mainDirectory, 'LICENSE')
                    }]
                });

                // Insert the licenses from conan
                const conanLicenseDir = path.join(mainDirectory, 'node_modules', '@autobet', 'autobetlib', 'licenses');
                for (let dir of await fs.readdir(conanLicenseDir)) {
                    const files = (await fs.readdir(path.join(conanLicenseDir, dir, 'licenses'))).map(f => ({
                        softwareName: path.basename(dir),
                        name: f,
                        path: path.join(conanLicenseDir, dir, 'licenses', f)
                    }));

                    loadedLicenses.push({
                        name: path.basename(dir),
                        id: index++,
                        files: files
                    });
                }

                // Insert the licenses from npm
                const licenses = (await import("../../licenses.json")).default;
                loadedLicenses.push(...licenses);

                // Fix the ids
                loadedLicenses.forEach((l: LicenseInfo, i: number) => l.id = i);
                autobetLib.logging.debug(`Successfully loaded ${loadedLicenses.length} licenses`);
            }

            resolve(loadedLicenses);
        });
    }

    @validate
    public static async getLicenseFile(id: number, name: string): Promise<CompleteLicenseFile> {
        let licenseFile: LicenseFile[] | undefined;
        if (loadedLicenses[id] != undefined && loadedLicenses[id].id === id) {
            licenseFile = loadedLicenses[id].files;
        } else {
            licenseFile = loadedLicenses.find(l => l.id === id)?.files;
            if (!licenseFile) throw new Error("Could not find a license for the given id");
        }

        let file = licenseFile.find(f => f.name === name);
        if (!file) {
            throw new Error("Could not find a license for the given name");
        }

        return {
            softwareName: file.softwareName,
            name: file.name,
            path: file.path,
            content: await fs.readFile(file.path, {encoding: 'utf-8'})
        };
    }

    @validate
    public static async getMainLicense(): Promise<CompleteLicenseFile> {
        return {
            softwareName: "Autobet",
            name: "LICENSE",
            path: path.join(mainDirectory, 'LICENSE'),
            content: await fs.readFile(path.join(mainDirectory, 'LICENSE'), {encoding: 'utf-8'})
        };
    }
}

export default classToObject(licenses);
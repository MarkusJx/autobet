/**
 * A class for making Github api calls
 */
class GithubApi {
    /**
     * Create a new GithubApi instance
     *
     * @param {string} owner the repository owner
     * @param {string} repo the repository to work with
     */
    constructor(owner, repo) {
        this.owner = owner;
        this.repo = repo;
    }

    /**
     * Get all workflows
     *
     * @returns {Promise<object>} the workflows object
     */
    async getWorkflows() {
        return fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs`).then(r => r.json());
    }

    /**
     * Get the artifacts produced by a workflow job
     *
     * @param {number} id the job id
     * @return {Object} the artifacts object
     */
    async getArtifactsForWorkflow(id) {
        return fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs/${id}/artifacts`).then(r => r.json());
    }

    /**
     * Get a run by a artifact's id
     *
     * @param {number} id the id to search for
     * @returns {Promise<Object>} the resulting run
     */
    async getRunByArtifactId(id) {
        const workflows = await this.getWorkflows();
        const runs = workflows.workflow_runs;
        for (let i = 0; i < runs.length; i++) {
            try {
                // Only check successful runs
                if (runs[i].status === "completed" && runs[i].conclusion === "success") {
                    let artifacts = await this.getArtifactsForWorkflow(runs[i].id);
                    artifacts = artifacts.artifacts;
                    for (let j = 0; j < artifacts.length; j++) {
                        if (artifacts[i].id === id) {
                            return runs[i];
                        }
                    }
                }
            } catch (ignored) {
            }
        }

        throw new Error("Could not get the run");
    }

    /**
     * Get the latest release
     *
     * @returns {Promise<Object>} the release info object
     */
    async getLatestRelease() {
        return fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`).then(r => r.json());
    }

    /**
     * Get the download address for the latest release
     *
     * @param {RegExp} releaseName the release regex
     * @return {Promise<string>} the download address
     */
    async getLatestReleaseDownloadAddress(releaseName) {
        const release = await this.getLatestRelease();
        const res = release.assets.find(e => e.name.match(releaseName));

        if (res !== undefined) {
            return res.browser_download_url;
        } else {
            throw new Error("Could not get the download url");
        }
    }

    /**
     * Get the latest release tag
     *
     * @returns {Promise<String>} the tag name or undefined, if the response could not be parsed
     */
    async getLatestReleaseTag() {
        let res = await this.getLatestRelease();
        return res.tag_name;
    }

    /**
     * Get the artifacts for this repo
     *
     * @returns {Promise<Object>} the artifact object
     */
    async getArtifacts() {
        return fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/actions/artifacts`).then(r => r.json());
    }

    /**
     * Get the latest artifact with a given name
     *
     * @param {RegExp | String} artifactName the artifact name. May be a string or regex to match against
     * @returns {Promise<Object>} the artifact object or undefined if the artifact could not be found
     */
    async getLatestArtifact(artifactName) {
        let artifacts = await this.getArtifacts();
        if (artifacts.hasOwnProperty("artifacts")) {
            artifacts = artifacts["artifacts"];
            for (let i = 0; i < artifacts.length; i++) {
                if (artifacts.hasOwnProperty(i) && artifacts[i].hasOwnProperty("name")) {
                    let name = artifacts[i]["name"];
                    if (name.match(artifactName)) {
                        return artifacts[i];
                    }
                }
            }
        }

        throw new Error("Could not get the latest artifact");
    }
}
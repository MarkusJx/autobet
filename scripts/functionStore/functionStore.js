module.exports = {
    functionStore: class {
        constructor(name, fnString, id) {
            this.name = name;
            this.functionString = fnString;
            this.ok = false;
            this.active = false;
            this.lastError = "";
            this.id = id;
        }
    }
}
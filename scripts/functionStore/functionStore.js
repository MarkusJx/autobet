module.functionStore = class {
    constructor(name, fnString) {
        this.name = name;
        this.fnString = fnString;
        this.ok = false;
        this.active = false;
        this.lastError = "";
    }

    setFunctionString(fn) {
        this.fnString = fn;
    }

    getFunctionString() {
        return this.fnString;
    }

    isActive() {
        return this.active;
    }

    setActive(val) {
        this.active = val;
    }

    getFunctionName() {
        return this.name;
    }

    setFunctionName(n) {
        this.name = n;
    }

    isOk() {
        return this.ok;
    }

    setOk(val) {
        this.ok = val;
    }

    getLastError() {
        return this.lastError;
    }

    setLastError(val) {
        this.lastError = val;
    }
}
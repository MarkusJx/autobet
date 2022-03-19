import {FunctionStore} from "./FunctionStore";
import StaticInstances from "./StaticInstances";

export default class BettingFunctionImplementation {
    private isActive: boolean = false;
    private isOk: boolean = false;
    private isWaiting: boolean = false;

    public constructor(
        public readonly implementation: string,
        public readonly name: string,
        private store: FunctionStore | null = null,
        public readonly isDefault: boolean = false
    ) {
    }

    public get ok(): boolean {
        return this.isOk;
    }

    public set ok(val: boolean) {
        this.isOk = val;
        if (!this.isDefault) this.store!.ok = val;
    }

    public get waiting(): boolean {
        return this.isWaiting;
    }

    public get active(): boolean {
        return this.isActive;
    }

    public set active(val: boolean) {
        this.isActive = val;

        if (val) {
            if (this.isDefault) {
                window.BettingFunctionUtil.revertToDefaultImpl();
            } else {
                try {
                    window.BettingFunctionUtil.setActiveFunction(this.store!);
                    this.store!.active = true;
                } catch (e: any) {
                    window.autobet.logging.error("BettingFunctionImplementation.ts", `Could not set the active function: ${e.message}`);
                    window.BettingFunctionUtil.revertToDefaultImpl();
                }
            }
        }
    }

    public static fromStore(store: FunctionStore): BettingFunctionImplementation {
        const fn = new BettingFunctionImplementation(store.functionString, store.name, store);
        fn.isOk = store.ok;
        fn.isActive = store.active;

        return fn;
    }

    public checkImplementation(): void {
        this.isWaiting = true;

        const result = window.BettingFunctionUtil.checkFunction(this.implementation, this.store == null ? "default" : this.store.id);
        this.ok = result.ok;
        this.isWaiting = false;

        StaticInstances.bettingFunctionResultDialog?.setResult(result.res);
        if (result.ok) {
            StaticInstances.bettingFunctionSuccessAlert?.setText(`The test of function '${this.name}' was ok`);
            StaticInstances.bettingFunctionSuccessAlert?.show(5000);
        } else {
            StaticInstances.bettingFunctionErrorAlert?.setText(`The test of function '${this.name}' returned an error`);
            StaticInstances.bettingFunctionErrorAlert?.show(5000);
        }
    }
}
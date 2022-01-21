import React from "react";
import Loadable from "../Loadable";
import StaticInstances from "../../../util/StaticInstances";
import TextFieldComponent, {numericInputProps} from "../../util/TextFieldComponent";

export default class AfterClickSleep extends TextFieldComponent<number> implements Loadable {
    public constructor(props: {}) {
        super("After click sleep", "Time", "Time to sleep after click", <>
            Set the time to sleep after a button is pressed. Increase this value if button clicks are
            not recognized by the game. Is a different value for different
            navigation strategies. Press enter to save.
        </>, numericInputProps(1, 10000), 100, props);
    }

    protected override onChange(val: any): number | null {
        const value = Number(val);
        if (value > 0 && value < 10000) {
            return value;
        } else {
            return null;
        }
    }

    protected override async onEnterPressed(): Promise<boolean> {
        if (this.value > 0 && this.value < 10000) {
            await window.autobet.uiNavigation.clicks.setAfterClickSleep(this.value);
            return true;
        } else {
            StaticInstances.sleepTimeInvalidValueAlert?.show(5000);
            return false;
        }
    }

    protected override async getStoredValue(): Promise<number> {
        return window.autobet.uiNavigation.clicks.getAfterClickSleep();
    }
}
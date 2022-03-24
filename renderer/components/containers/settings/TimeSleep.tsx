import React from "react";
import Loadable from "../Loadable";
import StaticInstances from "../../../util/StaticInstances";
import TextFieldComponent, {numericInputProps} from "../../util/TextFieldComponent";

export default class TimeSleep extends TextFieldComponent<number> implements Loadable {
    public constructor(props: {}) {
        super("Sleep time", "Time", "Time to sleep until the race has finished", <>
            Set the time to sleep after a bet has started. Use this option, when the program did not
            immediately start a new bet when the race has finished. Press enter to save, the default
            value is 36.
        </>, numericInputProps(1, 100), 36, props);
    }

    protected override onChange(val: any): number | null {
        const value = Number(val);
        if (value > 0 && value < 100) {
            return value;
        } else {
            return null;
        }
    }

    protected override async onEnterPressed(): Promise<boolean> {
        if (this.value > 0 && this.value < 10000) {
            window.autobet.settings.setTimeSleep(this.value);
            await window.autobet.settings.saveSettings();
            return true;
        } else {
            StaticInstances.sleepTimeInvalidValueAlert?.show(5000);
            return false;
        }
    }

    protected override async getStoredValue(): Promise<number> {
        return window.autobet.settings.getTimeSleep();
    }
}
import React from "react";
import StaticInstances from "../../../util/StaticInstances";
import SwitchComponent from "../../util/SwitchComponent";

export default class FullDebug extends SwitchComponent {
    public constructor(props: {}) {
        super("Extended Debugging", <>
            This option will create a zip file called 'autobet_debug.zip' on you Desktop. This File will
            contain a log and screenshots for debugging purposes. IMPORTANT: If you submit this file
            anywhere, make sure to delete any personal information from the zip file.
        </>, props);
    }

    public override componentDidMount(): void {
        this.disabled = false;
    }

    protected override async onChange(checked: boolean): Promise<void> {
        if (checked) {
            if (!window.autobet.logging.isLoggingToFile()) {
                await StaticInstances.debugSettings?.setLogToFile(true);
            }

            StaticInstances.debugSettings!.logToFileDisabled = true;
        } else {
            StaticInstances.debugSettings!.logToFileDisabled = false;
        }

        const ok = await window.autobet.settings.setDebugFull(checked);
        if (!ok) {
            this.checked = false;
            StaticInstances.extendedDebuggingErrorAlert?.show(5000);
            window.autobet.logging.warn("FullDebug.tsx", "setDebugFull returned false");
        }
    }
}
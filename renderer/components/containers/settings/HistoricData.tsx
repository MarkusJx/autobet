import SwitchComponent from "../../util/SwitchComponent";
import Loadable from "../Loadable";
import StaticInstances from "../../../util/StaticInstances";
import Code from "../../util/Code";
import React from "react";

export default class HistoricData extends SwitchComponent implements Loadable {
    public constructor(props: {}) {
        super("Collect historic data", <>
            This allows you to collect historic data about the betting process. The data will be stored in a csv file in
            {Code.create("YOUR_DOCUMENTS_FOLDER/autobet/stats.csv")} containing various stats like the odds of the
            horses that won or the amount of money made.
        </>, props);
    }

    public async loadData(): Promise<void> {
        this.disabled = true;
        const collect = await window.autobet.getCollectHistoricData();
        this.checked = collect;
        if (collect) await window.autobet.setCollectHistoricData(collect);
        this.disabled = false;
    }

    public override async onChange(checked: boolean): Promise<void> {
        await window.autobet.setCollectHistoricData(checked);
        StaticInstances.settingsSavedAlert?.show(5000);
    }
}
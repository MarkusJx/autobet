import SwitchComponent from "../../util/SwitchComponent";
import Loadable from "../Loadable";
import StaticInstances from "../../../util/StaticInstances";

export default class HistoricData extends SwitchComponent implements Loadable {
    public constructor(props: {}) {
        super("Collect historic data", <>

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
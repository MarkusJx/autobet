import SwitchComponent from "../../util/SwitchComponent";
import Loadable from "../Loadable";
import StaticInstances from "../../../util/StaticInstances";

export default class UPnPSelect extends SwitchComponent implements Loadable {
    public constructor(props: {}) {
        super("Enable UPnP", <>
            Enable or disable using Universal Plug and Play (UPnP) to expose ports for the web server.
            This setting can only be changed if the web server is not running. If enabled, UPnP must
            be enabled on your router to automatically expose ports. If you only want to access the web interface
            from your local network (e.g. inside your Wi-Fi), enabling this is not recommended as it will
            expose your system to potential attackers. If you want to access the web interface from outside your
            network (or use notifications), you can enable UPnP, but in this case, it is recommended to also
            enable SSL support alongside this. Consult the wiki for further information on that.
        </>, props);
    }

    public async loadData(): Promise<void> {
        this.disabled = true;
        this.checked = await window.autobet.settings.getUpnpEnabled();
        this.disabled = false;
    }

    protected override async onChange(checked: boolean): Promise<void> {
        await window.autobet.settings.setUpnpEnabled(checked);
        StaticInstances.settingsSavedAlert?.show(5000);
    }
}
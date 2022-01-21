import InfoDialog from "../components/dialogs/InfoDialog";
import CustomAlert from "../components/CustomAlert";
import Status from "../components/containers/Status";
import Settings from "../components/Settings";
import TimeRunning from "../components/containers/TimeRunning";
import GameRunning from "../components/containers/GameRunning";
import ClickSleep from "../components/containers/settings/ClickSleep";
import AfterClickSleep from "../components/containers/settings/AfterClickSleep";
import DebugSettings from "../components/containers/settings/DebugSettings";
import UPnPSelect from "../components/containers/settings/UPnPSelect";

export default class StaticInstances {
    public static timeRunning?: TimeRunning;
    public static infoDialog?: InfoDialog;
    public static status?: Status;
    public static settings?: Settings;
    public static gameRunning?: GameRunning;
    public static clickSleep?: ClickSleep;
    public static afterClickSleep?: AfterClickSleep;
    public static debugSettings?: DebugSettings;
    public static upnpSelect?: UPnPSelect;

    // Alerts
    public static settingsSavedAlert?: CustomAlert;
    public static gameNotRunningAlert?: CustomAlert;
    public static gameSelectedAlert?: CustomAlert;
    public static navigationStrategyAlert?: CustomAlert;
    public static navigationStrategyErrorAlert?: CustomAlert;
    public static sleepTimeInvalidValueAlert?: CustomAlert;
    public static settingsDiscardedAlert?: CustomAlert;
    public static extendedDebuggingErrorAlert?: CustomAlert;
    public static webserverStateChangeError?: CustomAlert;

    private constructor() {
    }
}
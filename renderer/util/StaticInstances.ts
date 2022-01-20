import InfoDialog from "../components/dialogs/InfoDialog";
import CustomAlert from "../components/CustomAlert";
import Status from "../components/containers/Status";
import Settings from "../components/Settings";
import TimeRunning from "../components/containers/TimeRunning";
import GameRunning from "../components/containers/GameRunning";

export default class StaticInstances {
    public static timeRunning?: TimeRunning;
    public static infoDialog?: InfoDialog;
    public static settingsSavedAlert?: CustomAlert;
    public static gameNotRunningAlert?: CustomAlert;
    public static gameSelectedAlert?: CustomAlert;
    public static status?: Status;
    public static settings?: Settings;
    public static gameRunning?: GameRunning;

    private constructor() {
    }
}
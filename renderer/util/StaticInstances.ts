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
import SSLSupport from "../components/containers/settings/SSLSupport";
import CertificateInfoDialog from "../components/dialogs/CertificateInfoDialog";
import QRCodeDialog from "../components/dialogs/QRCodeDialog";
import CustomBettingFunction from "../components/containers/settings/CustomBettingFunction";
import CustomSnackbar from "../components/util/CustomSnackbar";
import BettingFunctionResultDialog from "../components/dialogs/BettingFunctionResultDialog";
import SelectBettingFunctionNameDialog from "../components/dialogs/SelectBettingFunctionNameDialog";

export default class StaticInstances {
    public static timeRunning?: TimeRunning;
    public static status?: Status;
    public static settings?: Settings;
    public static gameRunning?: GameRunning;
    public static clickSleep?: ClickSleep;
    public static afterClickSleep?: AfterClickSleep;
    public static debugSettings?: DebugSettings;
    public static upnpSelect?: UPnPSelect;
    public static sslSupport?: SSLSupport;
    public static customBettingFunctionElement?: CustomBettingFunction;

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
    public static loadingCertificateAlert?: CustomAlert;
    public static settingsChangeErrorAlert?: CustomAlert;
    public static bettingFunctionErrorAlert?: CustomSnackbar;
    public static bettingFunctionSuccessAlert?: CustomSnackbar;
    public static bettingFunctionSavedAlert?: CustomAlert;

    // Dialogs
    public static infoDialog?: InfoDialog;
    public static certificateInfoDialog?: CertificateInfoDialog;
    public static qrCodeDialog?: QRCodeDialog;
    public static bettingFunctionResultDialog?: BettingFunctionResultDialog;
    public static selectBettingFunctionNameDialog?: SelectBettingFunctionNameDialog;

    private constructor() {
    }
}
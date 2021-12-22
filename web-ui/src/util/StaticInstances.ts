import AutobetApi from "./AutobetApi";
import {CppJsLib} from "../../../autobetlib/external/CppJsLib/ts/CppJsLib";
import CustomAlert from "../../components/util/CustomAlert";

export default class StaticInstances {
    public static readonly api: AutobetApi = <AutobetApi> new CppJsLib();
    public static gameNotRunningAlert: CustomAlert | null = null;
    public static bettingStartAlert: CustomAlert | null = null;
    public static bettingStopAlert: CustomAlert | null = null;
    public static bettingStartErrorAlert: CustomAlert | null = null;
    public static bettingStopErrorAlert: CustomAlert | null = null;
    public static notificationErrorAlert: CustomAlert | null = null;
    public static notificationPermissionDeniedAlert: CustomAlert | null = null;
    public static notificationsEnabledAlert: CustomAlert | null = null;
    public static notificationsDisabledAlert: CustomAlert | null = null;
}

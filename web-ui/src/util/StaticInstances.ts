import AutobetApi from "./AutobetApi";
import {CppJsLib} from "../../../autobetlib/external/CppJsLib/ts/CppJsLib";
import CustomAlert from "../../components/util/CustomAlert";

export default class StaticInstances {
    public static readonly api: AutobetApi = <AutobetApi> new CppJsLib();
    public static gameNotRunningAlert: CustomAlert | null = null;
    public static bettingStartAlert: CustomAlert | null = null;
    public static bettingStopAlert: CustomAlert | null = null;
}

import AutobetApi from "./AutobetApi";
import {CppJsLib} from "../../../autobetlib/external/CppJsLib/ts/CppJsLib";

export default class StaticInstances {
    public static readonly api: AutobetApi = <AutobetApi> new CppJsLib();
}

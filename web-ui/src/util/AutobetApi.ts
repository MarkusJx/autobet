import {CppJsLib} from "../../../autobetlib/external/CppJsLib/ts/CppJsLib";

export default abstract class AutobetApi extends CppJsLib {
    public abstract get_current_winnings(): Promise<number>;
    public abstract get_all_winnings(): Promise<number>;
    public abstract get_races_won(): Promise<number>;
    public abstract get_races_lost(): Promise<number>;
    public abstract get_time(): Promise<number>;
    public abstract get_running(): Promise<number>;
    public abstract js_start_script(): Promise<void>;
    public abstract js_stop_script(): Promise<void>;
}
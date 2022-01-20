import CustomAlert from "./CustomAlert";
import styles from "../styles/components/Alerts.module.scss";
import StaticInstances from "../util/StaticInstances";

export default function Alerts(): JSX.Element {
    return (
        <div className={styles.errorContainer}>
            <CustomAlert severity="success" ref={e => StaticInstances.settingsSavedAlert = e!} closeable>
                Settings saved successfully
            </CustomAlert>
            <CustomAlert severity="success" ref={e => StaticInstances.gameSelectedAlert = e!} closeable>
                Game application set to 'unknown - unknown'
            </CustomAlert>
            <CustomAlert severity="error" ref={e => StaticInstances.gameNotRunningAlert = e!} closeable>
                GTA V is not running on this machine. Start the game and try again.
            </CustomAlert>
        </div>
    );
}
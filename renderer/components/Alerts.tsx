import CustomAlert from "./CustomAlert";
import styles from "../styles/components/Alerts.module.scss";
import StaticInstances from "../util/StaticInstances";

export default function Alerts(): JSX.Element {
    return (
        <div className={styles.errorContainer}>
            <CustomAlert severity="error" ref={e => StaticInstances.sleepTimeInvalidValueAlert = e!} closeable>
                Could not change the sleep time: Invalid value supplied
            </CustomAlert>
            <CustomAlert severity="error" ref={e => StaticInstances.navigationStrategyErrorAlert = e!} closeable>
                Could not change the navigation strategy!
            </CustomAlert>
            <CustomAlert severity="error" ref={e => StaticInstances.gameNotRunningAlert = e!} closeable>
                GTA V is not running on this machine. Start the game and try again.
            </CustomAlert>
            <CustomAlert severity="error" ref={e => StaticInstances.extendedDebuggingErrorAlert = e!} closeable>
                Could not enable extended debugging: An unknown error occurred
            </CustomAlert>
            <CustomAlert severity="error" ref={e => StaticInstances.webserverStateChangeError = e!} closeable>
                Could not change the web server running state
            </CustomAlert>
            <CustomAlert severity="error" ref={e => StaticInstances.settingsChangeErrorAlert = e!} closeable>
                An error occurred while trying to change a setting
            </CustomAlert>
            <CustomAlert severity="info" ref={e => StaticInstances.settingsDiscardedAlert = e!} closeable>
                Settings discarded
            </CustomAlert>
            <CustomAlert severity="info" ref={e => StaticInstances.loadingCertificateAlert = e!}>
                Loading the certificate
            </CustomAlert>
            <CustomAlert severity="success" ref={e => StaticInstances.settingsSavedAlert = e!} closeable>
                Settings saved successfully
            </CustomAlert>
            <CustomAlert severity="success" ref={e => StaticInstances.gameSelectedAlert = e!} closeable>
                Game application set to 'unknown - unknown'
            </CustomAlert>
            <CustomAlert severity="success" ref={e => StaticInstances.navigationStrategyAlert = e!} closeable>
                Navigation strategy changed to 'unknown'
            </CustomAlert>
        </div>
    );
}
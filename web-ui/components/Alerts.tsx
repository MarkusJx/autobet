import React from "react";
import Home from "../pages";
import StaticInstances from "../src/util/StaticInstances";
import styles from "../styles/components/Alerts.module.scss";
import CustomAlert from "./util/CustomAlert";

interface AlertsProps {
    parent: Home;
}

export default class Alerts extends React.Component<AlertsProps> {
    private get parent(): Home {
        return this.props.parent;
    }

    public override render(): React.ReactNode {
        return (
            <div className={styles.errorContainer}>
                <CustomAlert ref={e => this.parent.connectionError = e} severity="error">
                    Could not connect to the backend!
                </CustomAlert>
                <CustomAlert severity="error" ref={e => StaticInstances.gameNotRunningAlert = e} closeable>
                    The game is not running on the target machine. Start the game and try again.
                </CustomAlert>
                <CustomAlert severity="error" ref={e => StaticInstances.bettingStartErrorAlert = e} closeable>
                    Could not start the betting process
                </CustomAlert>
                <CustomAlert severity="error" ref={e => StaticInstances.bettingStopErrorAlert = e} closeable>
                    Could not stop the betting process
                </CustomAlert>
                <CustomAlert severity="error" ref={e => StaticInstances.notificationErrorAlert = e} closeable>
                    Could not enable notifications: Your browser does not support notifications
                </CustomAlert>
                <CustomAlert severity="warning" ref={e => StaticInstances.notificationPermissionDeniedAlert = e} closeable>
                    Could not enable notifications: The permission was denied
                </CustomAlert>
                <CustomAlert severity="warning" ref={e => this.parent.disconnectedAlert = e} closeable>
                    Disconnected. Retrying to reconnect in 10 seconds.
                </CustomAlert>
                <CustomAlert severity="info" ref={e => this.parent.reloadingAlert = e}>
                    Reloading. This may take a while.
                </CustomAlert>
                <CustomAlert severity="info" closeable ref={e => StaticInstances.bettingStartAlert = e}>
                    Attempting to start the betting process...
                </CustomAlert>
                <CustomAlert severity="info" closeable ref={e => StaticInstances.bettingStopAlert = e}>
                    Attempting to stop the betting process...
                </CustomAlert>
                <CustomAlert severity="success" ref={e => this.parent.connectedAlert = e} closeable>
                    Successfully connected.
                </CustomAlert>
                <CustomAlert severity="success" ref={e => StaticInstances.notificationsEnabledAlert = e} closeable>
                    Successfully enabled notifications
                </CustomAlert>
                <CustomAlert severity="success" ref={e => StaticInstances.notificationsDisabledAlert = e} closeable>
                    Successfully disabled notifications
                </CustomAlert>
            </div>
        );
    }
}
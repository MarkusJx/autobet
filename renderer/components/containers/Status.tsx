import React from "react";
import Container from "../Container";
import styles from "../../styles/components/containers/Status.module.scss";

interface StatusState {
    statusText: string;
    className: string;
}

enum StatusValue {
    initializing,
    starting,
    running,
    stopping,
    stopped
}

export default class Status extends React.Component<{}, StatusState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            statusText: "Initializing",
            className: styles.init
        };
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Status" text={this.state.statusText} className={styles.status}
                       textClass={this.state.className}/>
        );
    }

    public setStatus(status: StatusValue): void {
        switch (status) {
            case StatusValue.initializing:
                this.setState({
                    statusText: "Initializing",
                    className: styles.init
                });
                break;
            case StatusValue.starting:
                this.setState({
                    statusText: "Starting",
                    className: styles.init
                });
                break;
            case StatusValue.running:
                this.setState({
                    statusText: "Running",
                    className: styles.running
                });
                break;
            case StatusValue.stopping:
                this.setState({
                    statusText: "Stopping",
                    className: styles.init
                });
                break;
            case StatusValue.stopped:
                this.setState({
                    statusText: "Stopped",
                    className: styles.stopped
                });
                break;
            default:
                throw new Error("Unknown status passed: " + status);
        }
    }
}
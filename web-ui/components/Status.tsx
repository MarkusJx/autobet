import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";

interface StatusState {
    text: "Stopped" | "Stopping" | "Starting" | "Running";
    color: "red" | "yellow" | "green";
}

export default class Status extends React.Component<{}, StatusState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            text: "Stopped",
            color: "red"
        };
    }

    public setStopped(): void {
        this.setState({
            text: "Stopped",
            color: "red"
        });
    }

    public setStopping(): void {
        this.setState({
            text: "Stopping",
            color: "yellow"
        });
    }

    public setStarting(): void {
        this.setState({
            text: "Starting",
            color: "yellow"
        });
    }

    public setRunning(): void {
        this.setState({
            text: "Running",
            color: "green"
        });
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Status">
                <StatusText text={this.state.text} color={this.state.color} outlined/>
            </Container>
        );
    }
}
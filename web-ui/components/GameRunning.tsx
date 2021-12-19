import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";

interface GameRunningState {
    running: boolean;
}

export default class GameRunning extends React.Component<{}, GameRunningState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            running: false
        };
    }

    public setRunning(running: boolean): void {
        this.setState({
            running: running
        });
    }

    public isRunning(): boolean {
        return this.state.running;
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Game running">
                <StatusText text={this.isRunning() ? "Yes" : "No"} color={this.isRunning() ? "green" : "red"}
                            outlined/>
            </Container>
        );
    }
}
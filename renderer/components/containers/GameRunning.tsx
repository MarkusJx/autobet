import React from "react";
import Container from "../Container";
import styles from "../../styles/components/containers/GameRunning.module.scss";

interface GameRunningState {
    running: boolean;
}

export default class GameRunning extends React.Component<any, GameRunningState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            running: false
        };
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Game running" text={this.state.running ? "Yes" : "No"}
                       textClass={this.state.running ? styles.running : styles.stopped}/>
        );
    }

    public get running(): boolean {
        return this.state.running;
    }

    public set running(running: boolean) {
        this.setState({
            running: running
        });
    }
}
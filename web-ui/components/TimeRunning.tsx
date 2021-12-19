import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import StaticInstances from "../src/util/StaticInstances";

interface TimeRunningState {
    time: string;
}

export default class TimeRunning extends React.Component<{}, TimeRunningState> {
    private curTime: number = 0;
    private timer: NodeJS.Timer | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            time: TimeRunning.convertToTime(0)
        };
    }

    public async startTimer(): Promise<void> {
        this.time = await StaticInstances.api.get_time();
        if (this.timer == null) {
            this.timer = setInterval(() => {
                this.time++;
            }, 1000);
        }
    }

    public stopTimer(): void {
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Time running">
                <StatusText text={this.state.time} outline color={"white"}/>
            </Container>
        );
    }

    public override componentDidMount(): void {
        console.log(this.render.name);
    }

    private set time(timeSeconds: number) {
        this.curTime = timeSeconds;
        this.setState({
            time: TimeRunning.convertToTime(timeSeconds)
        });
    }

    private get time(): number {
        return this.curTime;
    }

    private static convertToTime(secs: number): string {
        const getTime = (tm: number): string => (tm < 10) ? `0${tm}` : String(tm);

        const hours: number = Math.floor((secs % 86400) / 3600);
        const minutes: number = Math.floor((secs % 3600) / 60);
        const seconds: number = secs % 60;

        return `${getTime(hours)}:${getTime(minutes)}:${getTime(seconds)}`;
    }
}
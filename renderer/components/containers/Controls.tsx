import React from "react";
import {ContainerComponent, ContainerHeading, TextAlign} from "../Container";
import LoadingButton from '@mui/lab/LoadingButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import StaticInstances from "../../util/StaticInstances";
import {StatusValue} from "./Status";

interface ControlsState {
    start: boolean;
    loading: boolean;
    disabled: boolean;
    buttonText?: string;
}

export default class Controls extends React.Component<{}, ControlsState> {
    private running: boolean = false;
    private paused: boolean = true;
    private pausing: boolean = false;
    private timer?: NodeJS.Timeout;

    public constructor(props: {}) {
        super(props);

        this.state = {
            start: true,
            loading: false,
            disabled: true
        };
    }

    public set disabled(val: boolean) {
        this.setState({
            disabled: val
        });
    }

    private set buttonText(text: string | undefined) {
        this.setState({
            buttonText: text
        });
    }

    private set loading(val: boolean) {
        this.setState({
            loading: val
        });
    }

    private set showStartText(val: boolean) {
        this.setState({
            start: val
        });
    }

    public override render() {
        return (
            <ContainerComponent>
                <TextAlign>
                    <ContainerHeading>
                        Controls
                    </ContainerHeading>
                    <LoadingButton onClick={this.onClick.bind(this)}
                                   endIcon={this.state.start ? <PlayArrowIcon/> : <StopIcon/>}
                                   loading={this.state.loading} loadingPosition="end" variant="contained"
                                   style={{height: 'max-content', margin: 'auto'}} disabled={this.state.disabled}>
                        {this.state.buttonText || this.state.start ? "Start" : "Stop"}
                    </LoadingButton>
                </TextAlign>
            </ContainerComponent>
        );
    }

    public override componentDidMount(): void {
        window.autobet.callbacks.setUiKeycombStartCallback(this.onExternalStart.bind(this));
        window.autobet.callbacks.setUiKeycombStopCallback(this.onExternalStop.bind(this));
    }

    public enable(): void {
        this.disabled = false;
    }

    private onClick(): void {
        if (!this.running) {
            this.startBetting();
        } else if (!this.paused && !this.pausing) {
            this.pauseBetting(true);
        }
    }

    private onExternalStart(): void {
        StaticInstances.settings!.disabled = true;
        this.disabled = true;
        StaticInstances.status!.setStatus(StatusValue.starting);
        this.startTimer();
        this.disabled = false;
        this.showStartText = false;
        StaticInstances.status!.setStatus(StatusValue.running);
    }

    private onExternalStop(): void {
        this.pauseBetting(false);
    }

    private startTimer(): void {
        this.paused = false;
        this.pausing = false;
        this.running = true;

        this.timer = setInterval(() => {
            StaticInstances.timeRunning?.updateTimer();
        }, 1000);
    }

    private pauseTimer(): void {
        if (this.timer) clearInterval(this.timer);
        this.paused = true;
        this.running = false;
    }

    private startBetting(): void {
        if (!StaticInstances.gameRunning!.running) {
            StaticInstances.gameNotRunningAlert!.show(5000);
            return;
        }

        StaticInstances.settings!.disabled = true;
        this.disabled = true;
        this.loading = true;
        window.autobet.setStarting(true);
        StaticInstances.status!.setStatus(StatusValue.starting);

        let timeUntilStart: number = 15;
        const interval: NodeJS.Timeout = setInterval(() => {
            this.buttonText = `Starting in ${timeUntilStart}s`;
            timeUntilStart--;

            if (timeUntilStart < 0) {
                clearInterval(interval);
                this.startTimer();

                window.autobet.setStarting(false);
                window.autobet.startBetting();

                this.buttonText = undefined;
                this.disabled = false;
                this.loading = false;
                this.showStartText = false;
                StaticInstances.status!.setStatus(StatusValue.running);
            }
        }, 1000);
    }

    private pauseBetting(stopInBackend: boolean): void {
        if (stopInBackend) {
            window.autobet.stopBetting();
        }

        this.pausing = true;
        StaticInstances.status!.setStatus(StatusValue.stopping);
        this.disabled = true;

        const timeout: NodeJS.Timeout = setInterval(() => {
            if (window.autobet.stopped()) {
                clearInterval(timeout);
                this.setPaused();
            }
        }, 1000);
    }

    private setPaused(): void {
        if (this.pausing) {
            this.pausing = false;
            this.disabled = false;
            this.showStartText = true;
            this.pauseTimer();
            StaticInstances.status!.setStatus(StatusValue.stopped);
            StaticInstances.settings!.disabled = false;
        }
    }
}
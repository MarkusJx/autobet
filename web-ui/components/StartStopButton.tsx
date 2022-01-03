import React from "react";
import LoadingButton from '@mui/lab/LoadingButton';
import styles from "../styles/components/StartStopButton.module.scss";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import StaticInstances from "../src/util/StaticInstances";

interface StartStopButtonState {
    start: boolean;
    loading: boolean;
}

export default class StartStopButton extends React.Component<{}, StartStopButtonState> {
    private gameRunning: boolean = false;

    public constructor(props: {}) {
        super(props);

        this.state = {
            start: true,
            loading: false,
        };
    }

    public setLoading(loading: boolean): void {
        this.setState({
            loading: loading
        });
    }

    public displayStart(val: boolean): void {
        this.setState({
            start: val
        });
    }

    public setGameRunning(running: boolean): void {
        this.gameRunning = running;
    }

    public override render(): React.ReactNode {
        return (
            <div className={styles.buttonOuterContainer}>
                <div className={styles.buttonContainer}>
                    <LoadingButton onClick={this.onClick.bind(this)}
                                   endIcon={this.state.start ? <PlayArrowIcon/> : <StopIcon/>}
                                   loading={this.state.loading} loadingPosition="end" variant="contained"
                                   style={{height: 'max-content', margin: 'auto'}}>
                        {this.state.start ? "Start" : "Stop"}
                    </LoadingButton>
                </div>
            </div>
        );
    }

    private async onClick(): Promise<void> {
        if (!this.gameRunning && this.state.start) {
            StaticInstances.gameNotRunningAlert?.show(5000);
        } else {
            this.setLoading(true);
            if (this.state.start) {
                StaticInstances.bettingStartAlert?.show(5000);
                try {
                    await StaticInstances.api.js_start_script();
                    StaticInstances.bettingStartAlert?.hide();
                    StaticInstances.bettingStartedAlert?.show(5000);
                } catch (e) {
                    StaticInstances.bettingStartErrorAlert?.show(5000);
                    console.error("Could not start the betting process:", e);
                }
            } else {
                StaticInstances.bettingStopAlert?.show(5000);
                try {
                    await StaticInstances.api.js_stop_script();
                    StaticInstances.bettingStopAlert?.hide();
                    StaticInstances.bettingStoppedAlert?.show(5000);
                } catch (e) {
                    StaticInstances.bettingStopErrorAlert?.show(5000);
                    console.error("Could not stop the betting process:", e);
                }
            }
        }
    }
}
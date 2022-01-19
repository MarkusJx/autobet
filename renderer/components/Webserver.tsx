import React from "react";
import styles from "../styles/components/Webserver.module.scss";
import {Button, Switch} from "@mui/material";
import {ContainerComponent, ContainerHeading, TextAlign} from "./Container";
import {saveSettings} from "../util/util";
import Loadable from "./containers/Loadable";

interface WebserverState {
    buttonText: string;
    switchChecked: boolean;
    switchDisabled: boolean;
    weblinkDisabled: boolean;
    qrButtonDisabled: boolean;
}

export default class Webserver extends React.Component<any, WebserverState> implements Loadable {
    public constructor(props: {}) {
        super(props);

        this.state = {
            buttonText: "http://localhost:8027",
            switchChecked: false,
            switchDisabled: true,
            weblinkDisabled: true,
            qrButtonDisabled: true
        };
    }

    private set switchDisabled(val: boolean) {
        this.setState({
            switchDisabled: val
        });
    }

    private get switchChecked(): boolean {
        return this.state.switchChecked;
    }

    private set switchChecked(val: boolean) {
        this.setState({
            switchChecked: val
        });
    }

    private set weblinkDisabled(val: boolean) {
        this.setState({
            weblinkDisabled: val
        });
    }

    private set weblinkText(val: string) {
        this.setState({
            buttonText: val
        });
    }

    private set qrButtonDisabled(val: boolean) {
        this.setState({
            qrButtonDisabled: val
        });
    }

    private static onOpenWebpage(): void {
        window.autobet.openWebsite();
    }

    public override render(): React.ReactNode {
        return (
            <ContainerComponent className={styles.container}>
                <TextAlign>
                    <ContainerHeading>
                        Webserver
                    </ContainerHeading>
                    <ContainerHeading className={styles.runningOnText}>
                        Webserver running on:
                    </ContainerHeading>
                    <Button variant="text" className={styles.openWebButton} disabled={this.state.weblinkDisabled}
                            onClick={Webserver.onOpenWebpage}>
                        {this.state.buttonText}
                    </Button>
                </TextAlign>
                <TextAlign>
                    <ContainerHeading className={styles.enableDisableText}>
                        Enable/Disable
                    </ContainerHeading>
                    <Switch checked={this.state.switchChecked} onChange={this.onSwitchChange.bind(this)}
                            inputProps={{'aria-label': 'controlled'}} disabled={this.state.switchDisabled}
                            className={styles.enableDisableSwitch}/>
                    <Button variant="outlined" className={styles.showQRCodeButton}
                            disabled={this.state.qrButtonDisabled}>
                        Show QR-Code
                    </Button>
                </TextAlign>
            </ContainerComponent>
        );
    }

    public loadData(): void {
        this.switchDisabled = false;
        this.switchChecked = window.autobet.settings.webServerActivated();

        if (this.switchChecked) {
            this.weblinkDisabled = false;
            this.qrButtonDisabled = false;
            this.setIp();
        }
    }

    private setIp(): void {
        this.weblinkText = window.autobet.getIP();
    }

    private async onSwitchChange(_: any, checked: boolean): Promise<void> {
        this.switchDisabled = true;
        if (!await window.autobet.settings.setWebServer(checked)) {
            this.switchChecked = window.autobet.settings.webServerRunning();
        } else {
            this.switchChecked = checked;
        }

        if (this.switchChecked) {
            this.weblinkDisabled = false;
            this.qrButtonDisabled = false;
            this.setIp();
        } else {
            this.weblinkDisabled = true;
            this.weblinkText = "not running";
            this.qrButtonDisabled = true;
        }

        await saveSettings();
        this.switchDisabled = false;
    }
}
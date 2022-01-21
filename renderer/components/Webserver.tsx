import React from "react";
import styles from "../styles/components/Webserver.module.scss";
import {Button, Switch} from "@mui/material";
import {ContainerComponent, ContainerHeading, TextAlign} from "./Container";
import {saveSettings} from "../util/util";
import Loadable from "./containers/Loadable";
import StaticInstances from "../util/StaticInstances";

const NOT_RUNNING: string = "not running";

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
            buttonText: NOT_RUNNING,
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

    public async loadData(): Promise<void> {
        const checked = window.autobet.settings.webServerActivated();
        this.switchChecked = checked;

        if (checked) {
            const ok = await window.autobet.startWebServer();
            if (ok) {
                window.autobet.logging.debug("Webserver.tsx", "Web server started")
                StaticInstances.upnpSelect!.disabled = true;
                this.weblinkDisabled = false;
                this.qrButtonDisabled = false;
                this.setIp();
            } else {
                window.autobet.logging.error("Webserver.tsx", "Could not start web server");
                this.weblinkDisabled = true;
                this.weblinkText = NOT_RUNNING;
                this.qrButtonDisabled = true;
            }
        }
        this.switchDisabled = false;
    }

    private setIp(): void {
        this.weblinkText = window.autobet.getIP();
    }

    private async onSwitchChange(_: any, checked: boolean): Promise<void> {
        this.switchDisabled = true;
        StaticInstances.upnpSelect!.disabled = true;
        if (!await window.autobet.settings.setWebServer(checked)) {
            checked = window.autobet.settings.webServerRunning();
            StaticInstances.webserverStateChangeError?.show(5000);
        }

        this.switchChecked = checked;
        if (checked) {
            this.weblinkDisabled = false;
            this.qrButtonDisabled = false;
            this.setIp();
        } else {
            StaticInstances.upnpSelect!.disabled = false;
            this.weblinkDisabled = true;
            this.weblinkText = NOT_RUNNING;
            this.qrButtonDisabled = true;
        }

        await saveSettings();
        this.switchDisabled = false;
    }
}
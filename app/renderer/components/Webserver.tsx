import React from "react";
import styles from "../../styles/components/Webserver.module.scss";
import {Button, Switch} from "@mui/material";
import {ContainerComponent, ContainerHeading, TextAlign} from "./Container";

interface WebserverState {
    buttonText: string;
    switchChecked: boolean;
    switchDisabled: boolean;
}

export default class Webserver extends React.Component<any, WebserverState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            buttonText: "http://localhost:8027",
            switchChecked: false,
            switchDisabled: true
        };
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
                    <Button variant="text" className={styles.openWebButton}>
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
                    <Button variant="outlined" className={styles.showQRCodeButton}>
                        Show QR-Code
                    </Button>
                </TextAlign>
            </ContainerComponent>
        );
    }

    private onSwitchChange(): void {

    }
}
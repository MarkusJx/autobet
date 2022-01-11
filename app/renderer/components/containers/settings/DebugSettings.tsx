import React from "react";
import SettingContainer from "./SettingContainer";
import {InfoAlign, InfoIcon} from "./Info";
import {ContainerHeading, TextAlign} from "../../Container";
import {Switch} from "@mui/material";
import "core-js/stable";
import "regenerator-runtime/runtime";
import Terminal from 'react-console-emulator';
import {Scrollbars} from 'rc-scrollbars';
import "@fontsource/fira-code";
import styles from "../../../../styles/components/containers/settings/DebugSettings.module.scss";

interface DebugSettingsState {
    logToFile: boolean;
    logToConsole: boolean;
    loggedData: string[];
}

export default class DebugSettings extends React.Component<{}, DebugSettingsState> {
    private terminal: Terminal | null = null;
    private scrollbar: Scrollbars | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            logToFile: false,
            logToConsole: false,
            loggedData: []
        };
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer className={styles.container}>
                <InfoAlign className={styles.headingContainer}>
                    <ContainerHeading>Debugging and logging</ContainerHeading>
                    <InfoIcon/>
                </InfoAlign>
                <TextAlign>
                    <InfoAlign className={styles.infoAlignLogging}>
                        <ContainerHeading>Log to File</ContainerHeading>
                        <Switch checked={this.state.logToFile} onChange={this.onLogToFileChange.bind(this)}/>
                    </InfoAlign>
                    <InfoAlign className={styles.infoAlignLogging}>
                        <ContainerHeading>Log to Console</ContainerHeading>
                        <Switch checked={this.state.logToConsole} onChange={this.onLogToConsoleChange.bind(this)}/>
                    </InfoAlign>
                </TextAlign>
                <Scrollbars className={styles.scroll} autoHide autoHideTimeout={1000} autoHideDuration={200} autoHeight
                            autoHeightMin={0} autoHeightMax={1000} thumbMinSize={30} ref={e => this.scrollbar = e}>
                    <Terminal readOnly ref={(e: any) => this.terminal = e} commands={{}} className={styles.console}
                              messageClassName={styles.message} style={{minHeight: 0}}
                              contentStyle={{padding: this.state.logToConsole ? 20 : 0}}/>
                </Scrollbars>

            </SettingContainer>
        );
    }

    public override componentDidMount(): void {
        window.autobet.logging.setLogCallback(this.writeToConsole.bind(this));

        this.logToFile = window.autobet.logging.isLoggingToFile();
        this.logToConsole = window.autobet.logging.isLoggingToConsole();
    }

    public get logToFile(): boolean {
        return this.state.logToFile;
    }

    public set logToFile(val: boolean) {
        window.autobet.logging.setLogToFile(val);
        this.setState({
            logToFile: val
        });
    }

    public get logToConsole(): boolean {
        return this.state.logToConsole;
    }

    public set logToConsole(val: boolean) {
        window.autobet.logging.setLogToConsole(val);
        this.setState({
            logToConsole: val
        });
    }

    private writeToConsole(msg: string): void {
        const scrolledDown: boolean = (this.scrollbar?.getScrollTop()! + this.scrollbar?.getClientHeight()!) >=
            (this.scrollbar?.getScrollHeight()! - 20);
        this.terminal?.pushToStdout(msg);

        if (scrolledDown) {
            this.scrollbar?.scrollToBottom();
        }
    }

    private async onLogToFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        event.target.disabled = true;
        try {
            this.logToFile = event.target.checked;
            await window.autobet.settings.saveSettings();
        } catch (e) {
            console.error(e);
        }
        event.target.disabled = false;
    }

    private async onLogToConsoleChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        event.target.disabled = true;
        try {
            this.logToConsole = event.target.checked;
            await window.autobet.settings.saveSettings();
            if (!this.logToConsole) this.terminal?.clearStdout();
        } catch (e) {
            console.error(e);
        }
        event.target.disabled = false;
    }
}
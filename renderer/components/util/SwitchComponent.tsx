import React from "react";
import {TextType} from "../dialogs/Dialog";
import SettingContainer from "../containers/settings/SettingContainer";
import {ContainerHeading, TextAlign} from "../Container";
import {InfoAlign, InfoIcon} from "../containers/settings/Info";
import {Switch} from "@mui/material";
import StaticInstances from "../../util/StaticInstances";

interface SwitchComponentState {
    checked: boolean;
    disabled: boolean;
}

export default abstract class SwitchComponent extends React.Component<{}, SwitchComponentState> {
    protected constructor(
        private readonly heading: string,
        private readonly infoText: TextType,
        props: {}
    ) {
        super(props);

        this.state = {
            checked: false,
            disabled: true
        };
    }

    public get checked(): boolean {
        return this.state.checked;
    }

    public set checked(val: boolean) {
        this.setState({
            checked: val
        });
    }

    public set disabled(val: boolean) {
        this.setState({
            disabled: val
        });
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>{this.heading}</ContainerHeading>
                        <InfoIcon title={this.heading}>
                            {this.infoText}
                        </InfoIcon>
                    </InfoAlign>

                    <div style={{margin: 'auto'}}>
                        <Switch onChange={this.onSwitchChange.bind(this)} checked={this.checked}
                                disabled={this.state.disabled}/>
                    </div>
                </TextAlign>
            </SettingContainer>
        );
    }

    protected abstract onChange(checked: boolean): Promise<void>;

    private async onSwitchChange(_: React.ChangeEvent<HTMLInputElement>, checked: boolean): Promise<void> {
        this.disabled = true;
        this.checked = checked;

        try {
            await this.onChange(checked);
        } catch (e: any) {
            StaticInstances.settingsChangeErrorAlert?.show(10000);
            window.autobet.logging.error("SwitchComponent.tsx", e.message.toString());
            console.error(e);
            this.checked = !checked;
        }

        this.disabled = false;
    }
}
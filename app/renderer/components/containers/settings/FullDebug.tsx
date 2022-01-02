import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {Switch} from "@mui/material";

interface FullDebugState {
    checked: boolean;
    disabled: boolean;
}

export default class FullDebug extends React.Component<{}, FullDebugState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            checked: false,
            disabled: false
        };
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>Extended Debugging</ContainerHeading>
                        <InfoIcon/>
                    </InfoAlign>

                    <div style={{margin: 'auto'}}>
                        <Switch onChange={this.onChange.bind(this)} value={this.state.checked}
                                disabled={this.state.disabled}/>
                    </div>
                </TextAlign>
            </SettingContainer>
        );
    }

    public setChecked(val: boolean): void {
        this.setState({
            checked: val
        });
    }

    private setDisabled(val: boolean): void {
        this.setState({
            disabled: val
        });
    }

    private onChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.setChecked(true);
        this.setChecked(event.target.checked);
        // TODO
        this.setDisabled(false);
    }
}
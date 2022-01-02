import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import textFieldStyle from "./textFieldStyle";

enum NavStrategy {
    MOUSE = "Mouse",
    CONTROLLER = "Controller"
}

interface NavigationStrategyState {
    selectedStrategy: NavStrategy;
}

export default class NavigationStrategy extends React.Component<{}, NavigationStrategyState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            selectedStrategy: NavStrategy.MOUSE
        };
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>Navigation Strategy</ContainerHeading>
                        <InfoIcon/>
                    </InfoAlign>

                    <FormControl fullWidth style={textFieldStyle}>
                        <InputLabel id="nav-strategy-select-label">Navigation Strategy</InputLabel>
                        <Select labelId="nav-strategy-select-label" id="nav-strategy-select"
                                value={this.state.selectedStrategy} label="Navigation Strategy"
                                onChange={this.onStrategyChange.bind(this)}>
                            <MenuItem value={NavStrategy.MOUSE}>
                                {NavStrategy.MOUSE}
                            </MenuItem>
                            <MenuItem value={NavStrategy.CONTROLLER}>
                                {NavStrategy.CONTROLLER}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </TextAlign>
            </SettingContainer>
        );
    }

    private onStrategyChange(event: SelectChangeEvent): void {
        this.setState({
            selectedStrategy: event.target.value as NavStrategy
        });

        // TODO
    }
}
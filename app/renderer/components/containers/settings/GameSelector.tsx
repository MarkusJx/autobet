import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import textFieldStyle from "./textFieldStyle";

interface GameSelectorState {
    selectedGame: Program;
    applications: React.ReactNode[] | undefined;
}

export class Program {
    public constructor(public readonly windowName: string, public readonly programName: string) {
    }
}

export default class GameSelector extends React.Component<{}, GameSelectorState> {
    private static readonly GtaV = new Program("Grand Theft Auto V", "GTA5.exe");

    public constructor(props: {}) {
        super(props);

        this.state = {
            selectedGame: GameSelector.GtaV,
            applications: undefined
        };
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>Select Game</ContainerHeading>
                        <InfoIcon/>
                    </InfoAlign>

                    <FormControl fullWidth style={textFieldStyle}>
                        <InputLabel id="game-select-label">Navigation Strategy</InputLabel>
                        <Select labelId="game-select-label" id="game-select"
                                value={JSON.stringify(this.state.selectedGame)} label="Navigation Strategy"
                                onChange={this.onGameSelect.bind(this)}>
                            <MenuItem value={JSON.stringify(GameSelector.GtaV)}>
                                {`${GameSelector.GtaV.programName} - ${GameSelector.GtaV.windowName}`}
                            </MenuItem>
                            {this.state.applications}
                        </Select>
                    </FormControl>
                </TextAlign>
            </SettingContainer>
        );
    }

    public setApplications(apps: Program[]): void {
        this.setState({
            applications: this.getApplicationArray(apps)
        });
    }

    private getApplicationArray(apps: Program[]): React.ReactNode[] | undefined {
        const arr = apps.map(app => (
            <MenuItem value={JSON.stringify(app)}>
                {`${app.programName} - ${app.windowName}`}
            </MenuItem>
        ));

        if (arr.length === 0) {
            return undefined;
        } else {
            return arr;
        }
    }

    private onGameSelect(event: SelectChangeEvent): void {
        const app = JSON.parse(event.target.value as string) as Program;
        this.setState({
            selectedGame: app
        });
    }
}
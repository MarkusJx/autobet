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
                        <InfoIcon title="Game selector">
                            Select another (running) game executable other than 'GTA5.exe', if your GTA 5 program is
                            differently named or you are using a game streaming software to run the game on your PC. The
                            program you want to select must be running and visible. When selecting an executable, there
                            will be a list of programs starting with their executables name and separated by a hyphen,
                            there will be the name of the window created by the program.
                        </InfoIcon>
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
            <MenuItem value={JSON.stringify(app)} key={JSON.stringify(app)}>
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
import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import textFieldStyle from "./textFieldStyle";
import Loadable from "../Loadable";
import StaticInstances from "../../../util/StaticInstances";

interface GameSelectorState {
    selectedGame: Program;
    applications: Program[] | null;
    disabled: boolean;
}

export class Program {
    public constructor(public readonly windowName: string, public readonly programName: string) {
    }

    public equals(other: Program): boolean {
        return this.windowName === other.windowName && this.programName === other.programName;
    }
}

export default class GameSelector extends React.Component<{}, GameSelectorState> implements Loadable {
    private static readonly GtaV = new Program("Grand Theft Auto V", "GTA5.exe");

    public constructor(props: {}) {
        super(props);

        this.state = {
            selectedGame: GameSelector.GtaV,
            applications: null,
            disabled: false
        };
    }

    public set disabled(val: boolean) {
        this.setState({
            disabled: val
        });
    }

    private get applications(): Program[] | null {
        return this.state.applications;
    }

    private set applications(apps: Program[] | null) {
        this.setState({
            applications: apps
        });
    }

    private get selectedGame(): Program {
        return this.state.selectedGame;
    }

    private set selectedGame(game: Program) {
        this.setState({
            selectedGame: game
        });
    }

    private static getCurrentlySelected(): Program {
        const currentlySelected = window.autobet.windows.getGameWindowName();
        return new Program(currentlySelected.processName, currentlySelected.programName);
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

                    <FormControl fullWidth style={textFieldStyle} disabled={this.state.disabled}
                                 onClick={this.loadApplications.bind(this)}>
                        <InputLabel id="game-select-label">Navigation Strategy</InputLabel>
                        <Select labelId="game-select-label" id="game-select"
                                value={JSON.stringify(this.selectedGame)} label="Navigation Strategy"
                                onChange={this.onGameSelect.bind(this)}>
                            {this.getApplicationArray()}
                        </Select>
                    </FormControl>
                </TextAlign>
            </SettingContainer>
        );
    }

    public async loadData(): Promise<void> {
        await this.loadApplications();
        this.selectedGame = GameSelector.getCurrentlySelected();
    }

    private async loadApplications(): Promise<void> {
        const openWindows = await window.autobet.windows.getOpenWindows();
        const programs: Program[] = [];

        function onlyUnique(value: Program, index: number, self: Program[]) {
            return self.findIndex(v => value.equals(v)) === index;
        }

        for (let key in openWindows) {
            const windows = openWindows[key]
                .filter(w => key !== "GTA5.exe" && w !== "Grand Theft Auto V")
                .map(w => new Program(w, key));
            programs.push(...windows);
        }

        programs.push(GameSelector.getCurrentlySelected());
        programs.push(GameSelector.GtaV);
        this.applications = programs.filter(onlyUnique);
    }

    private getApplicationArray(): React.ReactNode[] | undefined {
        if (!this.applications) {
            return undefined;
        }

        const arr = this.applications.map(app => (
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

    private async onGameSelect(event: SelectChangeEvent): Promise<void> {
        const game = JSON.parse(event.target.value as string) as Program;

        this.selectedGame = game;
        await window.autobet.windows.setGameWindowName(game.programName, game.windowName);

        StaticInstances.gameSelectedAlert?.setText(
            `Game application set to '${game.programName} - ${game.windowName}'`
        );
        StaticInstances.gameSelectedAlert?.show(5000);
        StaticInstances.settingsSavedAlert?.show(5000);
    }
}
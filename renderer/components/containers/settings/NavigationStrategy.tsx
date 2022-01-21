import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {FormControl, InputLabel, MenuItem, Select, SelectChangeEvent} from "@mui/material";
import textFieldStyle from "./textFieldStyle";
import StaticInstances from "../../../util/StaticInstances";
import Loadable from "../Loadable";

enum NavStrategy {
    MOUSE = "Mouse",
    CONTROLLER = "Controller"
}

interface NavigationStrategyState {
    selectedStrategy: NavStrategy;
    disabled: boolean;
}

export default class NavigationStrategy extends React.Component<{}, NavigationStrategyState> implements Loadable {
    public constructor(props: {}) {
        super(props);

        this.state = {
            selectedStrategy: NavStrategy.MOUSE,
            disabled: true
        };
    }

    public set disabled(val: boolean) {
        this.setState({
            disabled: val
        });
    }

    private set strategy(strategy: NavStrategy) {
        this.setState({
            selectedStrategy: strategy
        });
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>Navigation Strategy</ContainerHeading>
                        <InfoIcon title="Select a navigation strategy">
                            Select a strategy to move the cursor in-Game. Currently supported options are 'Mouse' and
                            'Controller'. When using the 'Mouse' Strategy, the program moves your mouse (pointer) in
                            order to click the in-Game UI elements. When using the 'Controller' Strategy, the program
                            simulates a Controller using vXbox to click in-Game UI elements. NOTE: In order to use the
                            'Controller' strategy, ScpVBus must be installed and there must be no game controllers
                            connected to your PC. Additionally, you may sometimes have to change back to 'Mouse' and
                            then back to 'Controller' if the mouse pointer is not moving.
                        </InfoIcon>
                    </InfoAlign>

                    <FormControl fullWidth style={textFieldStyle} disabled={this.state.disabled}>
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

    public async loadData(): Promise<void> {
        const strategy = await window.autobet.uiNavigation.getNavigationStrategy();
        if (strategy === window.autobet.uiNavigation.navigationStrategy.MOUSE) {
            this.strategy = NavStrategy.MOUSE;
        } else if (strategy === window.autobet.uiNavigation.navigationStrategy.CONTROLLER) {
            this.strategy = NavStrategy.MOUSE;
        } else {
            this.disabled = false;
            throw new Error(`An error occurred while loading the navigation strategy: Unknown strategy: ${strategy}`);
        }

        this.disabled = false;
    }

    private async changeStrategy(strategy: NavStrategy): Promise<void> {
        let nativeStrategy: import("@autobet/autobetlib").uiNavigation.navigationStrategy;
        if (strategy === NavStrategy.MOUSE) {
            nativeStrategy = window.autobet.uiNavigation.navigationStrategy.MOUSE;
        } else if (strategy === NavStrategy.CONTROLLER) {
            nativeStrategy = window.autobet.uiNavigation.navigationStrategy.CONTROLLER;
        } else {
            throw new TypeError(`Unknown navigation strategy '${strategy}'`);
        }

        try {
            await window.autobet.uiNavigation.setNavigationStrategy(nativeStrategy);
        } catch (e: any) {
            throw new TypeError(`Could not change the navigation strategy: '${e.message}'`);
        }

        StaticInstances.navigationStrategyAlert?.setText(`Navigation strategy changed to '${strategy}'`);
        StaticInstances.navigationStrategyAlert?.show(5000);

        this.setState({
            selectedStrategy: strategy
        });
    }

    private async onStrategyChange(event: SelectChangeEvent): Promise<void> {
        const wasDisabled = this.state.disabled;
        this.disabled = true;
        const strategy = event.target.value as NavStrategy;

        try {
            await this.changeStrategy(strategy);
        } catch (e: any) {
            StaticInstances.navigationStrategyErrorAlert?.setText(e.message);
            StaticInstances.navigationStrategyErrorAlert?.show(5000);
            console.error(e);
        }

        StaticInstances.clickSleep?.loadData();
        StaticInstances.afterClickSleep?.loadData();
        if (!wasDisabled && this.state.disabled) {
            this.disabled = false;
        }
    }
}
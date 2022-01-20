import React from "react";
import SettingsDivider from "./SettingsDivider";
import {ThemeProvider} from "@mui/material";
import settingsTheme from "./containers/settings/settingsTheme";
import NavigationStrategy from "./containers/settings/NavigationStrategy";
import GameSelector from "./containers/settings/GameSelector";
import ClickSleep from "./containers/settings/ClickSleep";
import AfterClickSleep from "./containers/settings/AfterClickSleep";
import TimeSleep from "./containers/settings/TimeSleep";
import FullDebug from "./containers/settings/FullDebug";
import CustomBettingFunction from "./containers/settings/CustomBettingFunction";
import DebugSettings from "./containers/settings/DebugSettings";
import Loadable from "./containers/Loadable";

export default class Settings extends React.Component<{}, {}> implements Loadable {
    private navigationStrategy?: NavigationStrategy;
    private gameSelector?: GameSelector;
    private clickSleep?: ClickSleep;
    private afterClickSleep?: AfterClickSleep;
    private timeSleep?: TimeSleep;
    private debugSettings?: DebugSettings;
    private customBettingFunction?: CustomBettingFunction;

    public set disabled(val: boolean) {
        this.navigationStrategy!.disabled = val;
        this.gameSelector!.disabled = val;
        this.clickSleep!.disabled = val;
        this.afterClickSleep!.disabled = val;
        if (val) this.customBettingFunction?.hide();
        this.customBettingFunction!.openButtonDisabled = val;
    }

    public override render() {
        return (
            <>
                <SettingsDivider/>
                <ThemeProvider theme={settingsTheme}>
                    <NavigationStrategy ref={e => this.navigationStrategy = e!}/>
                    <GameSelector ref={e => this.gameSelector = e!}/>
                    <ClickSleep ref={e => this.clickSleep = e!}/>
                    <AfterClickSleep ref={e => this.afterClickSleep = e!}/>
                    <TimeSleep ref={e => this.timeSleep = e!}/>
                    <FullDebug/>
                    <CustomBettingFunction ref={e => this.customBettingFunction = e!}/>
                    <DebugSettings ref={e => this.debugSettings = e!}/>
                </ThemeProvider>
            </>
        );
    }

    public async loadData(): Promise<void> {
        this.timeSleep?.loadData();
        this.debugSettings?.loadData();
        await this.gameSelector?.loadData();
    }
}
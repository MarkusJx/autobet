import React from "react";
import SettingsDivider from "./SettingsDivider";
import NavigationStrategy from "./containers/settings/NavigationStrategy";
import GameSelector from "./containers/settings/GameSelector";
import ClickSleep from "./containers/settings/ClickSleep";
import AfterClickSleep from "./containers/settings/AfterClickSleep";
import TimeSleep from "./containers/settings/TimeSleep";
import FullDebug from "./containers/settings/FullDebug";
import CustomBettingFunction from "./containers/settings/CustomBettingFunction";
import DebugSettings from "./containers/settings/DebugSettings";
import Loadable from "./containers/Loadable";
import StaticInstances from "../util/StaticInstances";
import UPnPSelect from "./containers/settings/UPnPSelect";
import SSLSupport from "./containers/settings/SSLSupport";
import HistoricData from "./containers/settings/HistoricData";

export default class Settings extends React.Component<{}, {}> implements Loadable {
    private navigationStrategy?: NavigationStrategy;
    private gameSelector?: GameSelector;
    private timeSleep?: TimeSleep;
    private historicData?: HistoricData;
    private customBettingFunction?: CustomBettingFunction;
    private fullDebug?: FullDebug;

    public set disabled(val: boolean) {
        this.navigationStrategy!.disabled = val;
        this.gameSelector!.disabled = val;
        this.timeSleep!.disabled = val;
        StaticInstances.clickSleep!.disabled = val;
        StaticInstances.afterClickSleep!.disabled = val;
        if (val) this.customBettingFunction?.hide();
        this.customBettingFunction!.openButtonDisabled = val;
        this.historicData!.disabled = val;
    }

    public override render() {
        return (
            <>
                <SettingsDivider/>
                <NavigationStrategy ref={e => this.navigationStrategy = e!}/>
                <GameSelector ref={e => this.gameSelector = e!}/>
                <ClickSleep ref={e => StaticInstances.clickSleep = e!}/>
                <AfterClickSleep ref={e => StaticInstances.afterClickSleep = e!}/>
                <TimeSleep ref={e => this.timeSleep = e!}/>
                <FullDebug ref={e => this.fullDebug = e!}/>
                <UPnPSelect ref={e => StaticInstances.upnpSelect = e!}/>
                <SSLSupport ref={e => StaticInstances.sslSupport = e!}/>
                <HistoricData ref={e => this.historicData = e!}/>
                <CustomBettingFunction ref={e => this.customBettingFunction = e!}/>
                <DebugSettings ref={e => StaticInstances.debugSettings = e!}/>
            </>
        );
    }

    public async loadData(): Promise<void> {
        this.timeSleep?.loadData();
        StaticInstances.debugSettings?.loadData();
        StaticInstances.clickSleep?.loadData();
        StaticInstances.afterClickSleep?.loadData();
        await StaticInstances.upnpSelect?.loadData();
        await this.gameSelector?.loadData();
        await this.navigationStrategy?.loadData();
        await this.historicData?.loadData();
    }
}
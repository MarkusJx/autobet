import React from "react";
import BackgroundImage from "./BackgroundImage";
import styles from "../../styles/components/MainContent.module.scss";
import Title from "./containers/Title";
import Status from "./containers/Status";
import TimeRunning from "./containers/TimeRunning";
import MoneyThisHour from "./containers/MoneyThisHour";
import MoneyAllTime from "./containers/MoneyAllTime";
import RacesWon from "./containers/RacesWon";
import ProbabilityOfWinning from "./containers/ProbabilityOfWinning";
import Webserver from "./Webserver";
import GameRunning from "./containers/GameRunning";
import Controls from "./containers/Controls";
import SettingsDivider from "./SettingsDivider";
import NavigationStrategy from "./containers/settings/NavigationStrategy";
import {ThemeProvider} from "@mui/material";
import settingsTheme from "./containers/settings/settingsTheme";
import GameSelector from "./containers/settings/GameSelector";
import ClickSleep from "./containers/settings/ClickSleep";
import AfterClickSleep from "./containers/settings/AfterClickSleep";
import TimeSleep from "./containers/settings/TimeSleep";
import FullDebug from "./containers/settings/FullDebug";
import CustomBettingFunction from "./containers/settings/CustomBettingFunction";
import DebugSettings from "./containers/settings/DebugSettings";
import BettingErrorDialog from "./dialogs/BettingErrorDialog";
import StaticInstances from "../util/StaticInstances";
import {makeSumsDisplayable} from "../util/util";

export default class MainContent extends React.Component {
    private bettingErrorDialog: BettingErrorDialog | null = null;
    private moneyThisHour: MoneyThisHour | null = null;
    private moneyAllTime: MoneyAllTime | null = null;
    private racesWon: RacesWon | null = null;
    private probabilityOfWinning: ProbabilityOfWinning | null = null;

    private moneyMade: number = 0;
    private numRacesWon: number = 0;
    private numRacesLost: number = 0;
    private timeRunningSecs: number = 0;

    public override render(): React.ReactNode {
        return (
            <div className={styles.mainContent}>
                <BackgroundImage>
                    <Title/>
                    <Status/>
                    <TimeRunning/>
                    <MoneyThisHour ref={e => this.moneyThisHour = e}/>
                    <MoneyAllTime ref={e => this.moneyAllTime = e}/>
                    <RacesWon ref={e => this.racesWon = e}/>
                    <ProbabilityOfWinning ref={e => this.probabilityOfWinning = e}/>
                    <Webserver/>
                    <GameRunning/>
                    <Controls/>
                    <SettingsDivider/>
                    <ThemeProvider theme={settingsTheme}>
                        <NavigationStrategy/>
                        <GameSelector/>
                        <ClickSleep/>
                        <AfterClickSleep/>
                        <TimeSleep/>
                        <FullDebug/>
                        <CustomBettingFunction/>
                        <DebugSettings/>
                    </ThemeProvider>
                    <BettingErrorDialog ref={e => this.bettingErrorDialog = e}/>
                </BackgroundImage>
            </div>
        );
    }

    public override componentDidMount(): void {
        window.autobet.callbacks.setBettingExceptionCallback((err: string): void => {
            this.bettingErrorDialog?.setText(
                "The betting was stopped due to an exception thrown in the native module. " +
                "This may be caused by a program error or the game being " +
                "stuck on a screen. Error message: " + err
            );
            this.bettingErrorDialog?.open();
        });

        window.autobet.callbacks.setAddMoneyCallback((value: number): void => {
            if (value !== 0) {
                this.moneyMade += value;
                if (value > 0) this.numRacesWon++;
            } else {
                this.numRacesLost++;
            }

            this.moneyThisHour?.setText(makeSumsDisplayable(this.moneyPerHour, true) + "/hr");
            this.racesWon?.setText(String(this.numRacesWon));
            this.probabilityOfWinning?.setProbability(this.numRacesWon, this.numRacesLost);
        });
    }

    private get moneyPerHour(): number {
        return this.moneyMade * (3600 / this.timeRunningSecs);
    }
}
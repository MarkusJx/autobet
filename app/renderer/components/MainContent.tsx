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

export default class MainContent extends React.Component {
    public override render(): React.ReactNode {
        return (
            <div className={styles.mainContent}>
                <BackgroundImage>
                    <Title/>
                    <Status/>
                    <TimeRunning/>
                    <MoneyThisHour/>
                    <MoneyAllTime/>
                    <RacesWon/>
                    <ProbabilityOfWinning/>
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
                </BackgroundImage>
            </div>
        );
    }
}
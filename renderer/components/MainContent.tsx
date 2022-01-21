import React from "react";
import BackgroundImage from "./BackgroundImage";
import styles from "../styles/components/MainContent.module.scss";
import Title from "./containers/Title";
import Status, {StatusValue} from "./containers/Status";
import TimeRunning from "./containers/TimeRunning";
import MoneyThisHour from "./containers/MoneyThisHour";
import MoneyAllTime from "./containers/MoneyAllTime";
import RacesWon from "./containers/RacesWon";
import ProbabilityOfWinning from "./containers/ProbabilityOfWinning";
import Webserver from "./Webserver";
import GameRunning from "./containers/GameRunning";
import Controls from "./containers/Controls";
import BettingErrorDialog from "./dialogs/BettingErrorDialog";
import StaticInstances from "../util/StaticInstances";
import {makeSumsDisplayable} from "../util/util";
import InfoDialog from "./dialogs/InfoDialog";
import Settings from "./Settings";
import {ThemeProvider} from "@mui/material";
import settingsTheme from "./containers/settings/settingsTheme";

export default class MainContent extends React.Component<{}, {}> {
    private bettingErrorDialog: BettingErrorDialog | null = null;
    private moneyThisHour: MoneyThisHour | null = null;
    private moneyAllTime: MoneyAllTime | null = null;
    private racesWon: RacesWon | null = null;
    private probabilityOfWinning: ProbabilityOfWinning | null = null;
    private webserver: Webserver | null = null;
    private controls: Controls | null = null;

    private moneyMade: number = 0;
    private numRacesWon: number = 0;
    private numRacesLost: number = 0;

    private get moneyPerHour(): number {
        return this.moneyMade * (3600 / StaticInstances.timeRunning!.timeRunning);
    }

    public override render(): React.ReactNode {
        return (
            <div className={styles.mainContent}>
                <BackgroundImage>
                    <ThemeProvider theme={settingsTheme}>
                        <Title/>
                        <Status ref={e => StaticInstances.status = e!}/>
                        <TimeRunning ref={e => StaticInstances.timeRunning = e!}/>
                        <MoneyThisHour ref={e => this.moneyThisHour = e}/>
                        <MoneyAllTime ref={e => this.moneyAllTime = e}/>
                        <RacesWon ref={e => this.racesWon = e}/>
                        <ProbabilityOfWinning ref={e => this.probabilityOfWinning = e}/>
                        <Webserver ref={e => this.webserver = e}/>
                        <GameRunning ref={e => StaticInstances.gameRunning = e!}/>
                        <Controls ref={e => this.controls = e}/>
                        <Settings ref={e => StaticInstances.settings = e!}/>
                        <BettingErrorDialog ref={e => this.bettingErrorDialog = e}/>
                        <InfoDialog ref={e => StaticInstances.infoDialog = e!}/>
                    </ThemeProvider>
                </BackgroundImage>
            </div>
        );
    }

    public override componentDidMount(): void {
        window.autobet.callbacks.setBettingExceptionCallback((err: string): void => {
            this.bettingErrorDialog!.setText(
                "The betting was stopped due to an exception thrown in the native module. " +
                "This may be caused by a program error or the game being " +
                "stuck on a screen. Error message: " + err
            );
            this.bettingErrorDialog!.open();
        });

        window.autobet.callbacks.setAddMoneyCallback((value: number): void => {
            if (value !== 0) {
                this.moneyMade += value;
                if (value > 0) this.numRacesWon++;
            } else {
                this.numRacesLost++;
            }

            this.moneyThisHour!.setText(makeSumsDisplayable(this.moneyPerHour, true) + "/hr");
            this.racesWon!.setText(String(this.numRacesWon));
            this.probabilityOfWinning!.setProbability(this.numRacesWon, this.numRacesLost);
        });

        window.autobet.callbacks.setAllMoneyMadeCallback((value: number) => {
            this.moneyAllTime!.setText(makeSumsDisplayable(value));
        });

        window.autobet.callbacks.setGtaRunningCallback((running: boolean) => {
            StaticInstances.gameRunning!.running = running;
        });

        window.autobet.init().then(this.loadData.bind(this));

        window.onbeforeunload = function (): void {
            window.autobet.shutdown().then(() => {
                window.util.quit();
            });
        }
    }

    private async loadData(initialized: boolean): Promise<void> {
        if (initialized) {
            StaticInstances.status!.setStatus(StatusValue.stopped);
            this.controls!.enable();
        } else {
            window.autobet.logging.error("MainContent.tsx", "Could not initialize");
            return;
        }

        await window.autobet.loadWinnings();
        await StaticInstances.settings!.loadData();
        await this.webserver!.loadData();

        await window.autobet.setOddTranslations();
        await window.autobet.start();
    }
}
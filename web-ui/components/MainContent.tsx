import React from "react";
import styles from "../styles/Home.module.scss";
import Status from "./Status";
import TimeRunning from "./TimeRunning";
import MoneyPerHour from "./MoneyPerHour";
import StaticInstances from "../src/util/StaticInstances";
import MoneyAllTime from "./MoneyAllTime";
import RacesWon from "./RacesWon";
import ProbOfWinning from "./ProbOfWinning";
import MoneyThisSession from "./MoneyThisSession";
import GameRunning from "./GameRunning";
import RacesLost from "./RacesLost";
import StartStopButton from "./StartStopButton";
import EnableNotifications from "./EnableNotifications";

export default class MainContent extends React.Component {
    private status: Status | null = null;
    private timeRunning: TimeRunning | null = null;
    private moneyPerHour: MoneyPerHour | null = null;
    private moneyAllTime: MoneyAllTime | null = null;
    private racesWon: RacesWon | null = null;
    private racesLost: RacesLost | null = null;
    private probOfWinning: ProbOfWinning | null = null;
    private moneyThisSession: MoneyThisSession | null = null;
    private gameRunning: GameRunning | null = null;
    private startStopButton: StartStopButton | null = null;
    private enableNotifications: EnableNotifications | null = null;

    public override render(): React.ReactNode {
        return (
            <div className={styles.mainContent}>
                <Status ref={e => this.status = e}/>
                <TimeRunning ref={e => this.timeRunning = e}/>
                <MoneyPerHour ref={e => this.moneyPerHour = e}/>
                <MoneyAllTime ref={e => this.moneyAllTime = e}/>
                <RacesWon ref={e => this.racesWon = e}/>
                <RacesLost ref={e => this.racesLost = e}/>
                <ProbOfWinning ref={e => this.probOfWinning = e}/>
                <MoneyThisSession ref={e => this.moneyThisSession = e}/>
                <GameRunning ref={e => this.gameRunning = e}/>
                <StartStopButton ref={e => this.startStopButton = e}/>
                <EnableNotifications ref={e => this.enableNotifications = e}/>
            </div>
        );
    }

    public override componentDidMount(): void {
        StaticInstances.api.expose(this.webSetRunning.bind(this), "webSetStarted");
        StaticInstances.api.expose(this.webSetStopped.bind(this), "webSetStopped");
        StaticInstances.api.expose(this.webSetStopping.bind(this), "webSetStopping");
        StaticInstances.api.expose(this.webSetStarting.bind(this), "webSetStarting");
        StaticInstances.api.expose(this.webSetGtaRunning.bind(this), "webSetGtaRunning");
        StaticInstances.api.expose(this.webSetWinnings.bind(this), "webSetWinnings");
        StaticInstances.api.expose(this.webSetWinningsAll.bind(this), "webSetWinningsAll");
        StaticInstances.api.expose(this.webSetRacesWon.bind(this), "webSetRacesWon");
        StaticInstances.api.expose(this.webSetRacesLost.bind(this), "webSetRacesLost");
    }

    public async loadData(): Promise<void> {
        StaticInstances.api.get_current_winnings().then(this.webSetWinnings.bind(this));
        StaticInstances.api.get_all_winnings().then(this.webSetWinningsAll.bind(this));
        StaticInstances.api.get_time().then(this.timeRunning?.setTime!.bind(this.timeRunning));
        StaticInstances.api.get_races_won().then(this.webSetRacesWon.bind(this));
        StaticInstances.api.get_races_lost().then(this.webSetRacesLost.bind(this));
        StaticInstances.api.get_current_winnings().then(this.webSetWinnings.bind(this));

        const running: number = await StaticInstances.api.get_running();
        switch (running) {
            case -1: // Stopped
                await this.webSetStopped();
                break;
            case 0: // Stopping
                await this.webSetStopping();
                break;
            case 1: // Running
                await this.webSetRunning();
                break;
            case 2: // Starting
                await this.webSetStarting();
                break;
            default:
                throw new Error("Invalid value received from CppJsLib.get_running(): " + running);
        }
    }

    private async webSetGtaRunning(running: boolean): Promise<void> {
        this.gameRunning?.setRunning(running);
        this.startStopButton?.setGameRunning(running);
    }

    private async webSetWinnings(winnings: number): Promise<void> {
        this.moneyThisSession?.setValue(winnings);
        if (this.timeRunning?.getTime()! > 0) {
            this.moneyPerHour?.setValue(winnings * (3600 / this.timeRunning?.getTime()!));
        }
    }

    private async webSetWinningsAll(winnings: number): Promise<void> {
        this.moneyAllTime?.setValue(winnings);
    }

    private async webSetRunning(): Promise<void> {
        this.status?.setRunning();
        this.timeRunning?.startTimer().then();
        this.startStopButton?.displayStart(false);
        this.startStopButton?.setLoading(false);
    }

    private async webSetStopped(): Promise<void> {
        this.status?.setStopped();
        this.timeRunning?.stopTimer();
        this.startStopButton?.displayStart(true);
        this.startStopButton?.setLoading(false);
    }

    private async webSetStopping(): Promise<void> {
        this.status?.setStopping();
        this.timeRunning?.startTimer().then();
        this.startStopButton?.setLoading(true);
    }

    private async webSetStarting(): Promise<void> {
        this.status?.setStarting();
        this.timeRunning?.startTimer().then();
        this.startStopButton?.setLoading(true);
    }

    private async webSetRacesWon(won: number): Promise<void> {
        this.racesWon?.setValue(won);
        this.probOfWinning?.setValues(won, this.racesLost?.getValue()!);
    }

    private async webSetRacesLost(lost: number): Promise<void> {
        this.racesLost?.setValue(lost);
        this.probOfWinning?.setValues(this.racesWon?.getValue()!, lost);
    }
}
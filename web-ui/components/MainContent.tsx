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

export default class MainContent extends React.Component {
    private status: Status | null = null;
    private timeRunning: TimeRunning | null = null;
    private moneyPerHour: MoneyPerHour | null = null;
    private moneyAllTime: MoneyAllTime | null = null;
    private racesWon: RacesWon | null = null;
    private probOfWinning: ProbOfWinning | null = null;
    private moneyThisSession: MoneyThisSession | null = null;

    public override render(): React.ReactNode {
        return (
            <div className={styles.mainContent}>
                <Status ref={e => this.status = e}/>
                <TimeRunning ref={e => this.timeRunning = e}/>
                <MoneyPerHour ref={e => this.moneyPerHour = e}/>
                <MoneyAllTime ref={e => this.moneyAllTime = e}/>
                <RacesWon ref={e => this.racesWon = e}/>
                <ProbOfWinning ref={e => this.probOfWinning = e}/>
                <MoneyThisSession ref={e => this.moneyThisSession = e}/>
            </div>
        );
    }

    public override componentDidMount(): void {
        StaticInstances.api.expose(this.webSetStarted.bind(this), "webSetStarted");
        StaticInstances.api.expose(this.webSetStopped.bind(this), "webSetStopped");
        StaticInstances.api.expose(this.webSetStopping.bind(this), "webSetStopping");
        StaticInstances.api.expose(this.webSetStarting.bind(this), "webSetStarting");
    }

    private async webSetStarted(): Promise<void> {
        this.status?.setRunning();
        this.timeRunning?.startTimer().then();
    }

    private async webSetStopped(): Promise<void> {
        this.status?.setStopped();
        this.timeRunning?.stopTimer();
    }

    private async webSetStopping(): Promise<void> {
        this.status?.setStopping();
        this.timeRunning?.startTimer().then();
    }

    private async webSetStarting(): Promise<void> {
        this.status?.setStarting();
        this.timeRunning?.startTimer().then();
    }
}
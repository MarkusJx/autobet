import TextContainerComponent from "../TextContainerComponent";

export default class TimeRunning extends TextContainerComponent {
    private secs: number = 0;

    public constructor(props: {}) {
        super(props, "Time running", "00:00:00");
    }

    public get timeRunning(): number {
        return this.secs;
    }

    public updateTimer(): void {
        this.secs = window.autobet.getTimeRunning();
        this.setText(this.getTimeAsReadable());
    }

    /**
     * Convert time in seconds to more readable time in the format HH:mm:ss
     *
     * @returns the time in a readable format
     */
    private getTimeAsReadable(): string {
        let hours: number | string = Math.floor((this.secs % 86400) / 3600);
        let minutes: number | string = Math.floor((this.secs % 3600) / 60);
        let seconds: number | string = this.secs % 60;
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        return hours + ':' + minutes + ':' + seconds;
    }
}
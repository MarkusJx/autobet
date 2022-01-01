import TextContainerComponent from "../TextContainerComponent";

export default class TimeRunning extends TextContainerComponent {
    public constructor(props: {}) {
        super(props, "Time running", "00:00:00");
    }
}
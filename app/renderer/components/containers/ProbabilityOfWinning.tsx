import TextContainerComponent from "../TextContainerComponent";

export default class ProbabilityOfWinning extends TextContainerComponent {
    public constructor(props: {}) {
        super(props, "Probability of winning", "0.0%");
    }

    public setProbability(won: number, lost: number): void {
        this.setText(Math.round((won / (won + lost)) * 1000) / 10 + "%");
    }
}
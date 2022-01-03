import ValueComponent from "./util/ValueComponent";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import React from "react";

export default class ProbOfWinning extends ValueComponent {
    public setValues(won: number, lost: number): void {
        if ((won + lost) > 0) {
            super.setValue(Math.round((won / (won + lost)) * 1000) / 10);
        }
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Probability of winning">
                <StatusText text={`${this.state.value}%`} color="white" outlined/>
            </Container>
        );
    }
}
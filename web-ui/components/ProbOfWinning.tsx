import ValueComponent from "./util/ValueComponent";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import React from "react";

export default class ProbOfWinning extends ValueComponent {
    public override render(): React.ReactNode {
        return (
            <Container heading="Probability of winning">
                <StatusText text={`${this.state.value}%`} color="white" outline/>
            </Container>
        );
    }
}
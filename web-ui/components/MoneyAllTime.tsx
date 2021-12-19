import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import ValueComponent from "./util/ValueComponent";

export default class MoneyAllTime extends ValueComponent {
    public override render(): React.ReactNode {
        return (
            <Container heading="Money earned all time">
                <StatusText text={`$${this.state.value}`} color="white"/>
            </Container>
        );
    }
}
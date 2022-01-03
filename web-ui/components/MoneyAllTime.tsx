import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import MoneyComponent from "./util/MoneyComponent";

export default class MoneyAllTime extends MoneyComponent {
    public override render(): React.ReactNode {
        return (
            <Container heading="Money earned all time">
                <StatusText text={this.state.value} color="white" outlined/>
            </Container>
        );
    }
}
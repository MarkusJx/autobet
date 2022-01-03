import Container from "./util/Container";
import StatusText from "./util/StatusText";
import React from "react";
import MoneyComponent from "./util/MoneyComponent";

export default class MoneyThisSession extends MoneyComponent {
    public override render(): React.ReactNode {
        return (
            <Container heading="Money made this session">
                <StatusText text={this.state.value} color="white" outlined/>
            </Container>
        );
    }
}
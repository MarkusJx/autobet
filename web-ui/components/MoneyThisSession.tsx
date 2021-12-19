import ValueComponent from "./util/ValueComponent";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import React from "react";

export default class MoneyThisSession extends ValueComponent {
    public override render(): React.ReactNode {
        return (
            <Container heading="Money made this session">
                <StatusText text={`$${this.state.value}`} color="white" outline/>
            </Container>
        );
    }
}
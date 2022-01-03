import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import MoneyComponent from "./util/MoneyComponent";

export default class MoneyPerHour extends MoneyComponent {
    public constructor(props: {}) {
        super(props, true, 0);
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Money earned per hour">
                <StatusText text={`${this.state.value}/hr`} color="white" outlined/>
            </Container>
        );
    }
}
import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";

interface MoneyPerHourState {
    moneyPerHour: number;
}

export default class MoneyPerHour extends React.Component<{}, MoneyPerHourState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            moneyPerHour: 0
        };
    }

    public setMoneyPerHour(value: number): void {
        this.setState({
            moneyPerHour: value
        });
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Money earned per hour">
                <StatusText text={`$${this.state.moneyPerHour}/hr`} color="white" outline/>
            </Container>
        );
    }
}
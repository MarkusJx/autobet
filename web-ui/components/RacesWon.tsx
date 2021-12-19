import ValueComponent from "./util/ValueComponent";
import React from "react";
import Container from "./util/Container";
import StatusText from "./util/StatusText";

export default class RacesWon extends ValueComponent {
    public override render(): React.ReactNode {
        return (
            <Container heading="Races won">
                <StatusText text={String(this.state.value)} color="white" outline/>
            </Container>
        );
    }
}
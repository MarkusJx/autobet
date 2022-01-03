import ValueComponent from "./util/ValueComponent";
import Container from "./util/Container";
import StatusText from "./util/StatusText";
import React from "react";

export default class RacesLost extends ValueComponent {
    public override render(): React.ReactNode {
        return (
            <Container heading="Races Lost">
                <StatusText text={String(this.getValue())} color="white" outlined/>
            </Container>
        );
    }
}
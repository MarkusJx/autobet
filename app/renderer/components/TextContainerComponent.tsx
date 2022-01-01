import React from "react";
import Container from "./Container";

interface TextContainerComponentState {
    text: string;
}

export default class TextContainerComponent extends React.Component<any, TextContainerComponentState> {
    public constructor(props: any, private readonly heading: string, initialText: string) {
        super(props);

        this.state = {
            text: initialText
        };
    }

    public override render() {
        return <Container heading={this.heading} text={this.state.text}/>;
    }

    protected setText(text: string): void {
        this.setState({
            text: text
        });
    }
}
import React from "react";

interface ValueComponentState {
    value: number;
}

export default abstract class ValueComponent extends React.Component<{}, ValueComponentState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            value: 0
        };
    }

    public setValue(val: number): void {
        this.setState({
            value: val
        });
    }

    public getValue(): number {
        return this.state.value;
    }
}
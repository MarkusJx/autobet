import React from "react";

interface MoneyComponentState {
    originalValue: number;
    value: string;
}

export default class MoneyComponent extends React.Component<{}, MoneyComponentState> {
    public constructor(
        props: {},
        private readonly showThousand: boolean = false,
        private readonly fractionDigits: number = 2
    ) {
        super(props);

        this.state = {
            originalValue: 0,
            value: "$0"
        };
    }

    public setValue(val: number): void {
        this.setState({
            originalValue: val,
            value: this.moneyValueToString(val)
        });
    }

    public getValue(): number {
        return this.state.originalValue;
    }

    private moneyValueToString(sum: number): string {
        const negative: boolean = sum < 0;
        sum = Math.abs(sum);

        let res: string;
        if (sum >= 1000000000) { // One billion
            res = (sum / 1000000000).toFixed(this.fractionDigits) + "B";
        } else if (sum >= 1000000) { // One million
            res = (sum / 1000000).toFixed(this.fractionDigits) + "M";
        } else if (this.showThousand && sum >= 1000) { // One thousand
            res = (sum / 1000).toFixed(this.fractionDigits) + "K";
        } else {
            res = String(sum);
        }

        if (negative) {
            return "-$" + res;
        } else {
            return "$" + res;
        }
    }
}
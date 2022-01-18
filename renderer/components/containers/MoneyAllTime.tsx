import TextContainerComponent from "../TextContainerComponent";

export default class MoneyAllTime extends TextContainerComponent {
    public constructor(props: {}) {
        super(props, "Money earned all time", "$0");
    }
}
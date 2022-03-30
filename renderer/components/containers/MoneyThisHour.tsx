import TextContainerComponent from "../TextContainerComponent";

export default class MoneyThisHour extends TextContainerComponent {
    public constructor(props: {}) {
        super(props, "Money earned per hour", "$0/hr");
    }
}
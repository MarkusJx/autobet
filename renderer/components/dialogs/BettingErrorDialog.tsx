import {ADialog} from "./Dialog";

export default class BettingErrorDialog extends ADialog {
    public constructor(props: {}) {
        super(props, "Betting stopped", "");
    }
}
import {ADialog} from "./Dialog";

export default class InitErrorDialog extends ADialog {
    public constructor(props: {}) {
        super(props,
            "Initialization failed",
            "",
            false,
            () => window.autobet.shutdown().then(window.util.quit)
        );
    }
}
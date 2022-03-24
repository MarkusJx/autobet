import {ADialog, TextType} from "./Dialog";

export default class InfoDialog extends ADialog {
    public constructor(props: {}) {
        super(props, "", "", false);
    }

    public setInfoTextAndOpen(title: string, text: TextType): void {
        this.setTitle(title);
        this.setText(text);
        this.open();
    }
}
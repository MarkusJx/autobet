import {ADialog} from "./Dialog";
import QRCode from "react-qr-code";

export default class QRCodeDialog extends ADialog {
    public constructor(props: {}) {
        super(props, "Scan this QR code to access the web ui", "QR code unset", false);
    }

    public setUrl(url: string): void {
        this.setText(<QRCode value={url} style={{margin: 'auto', display: 'block'}}/>);
    }
}
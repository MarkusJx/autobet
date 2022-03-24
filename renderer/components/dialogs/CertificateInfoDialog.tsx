import {ADialog} from "./Dialog";
import React, {CSSProperties} from "react";

export default class CertificateInfoDialog extends ADialog {
    public constructor(props: {}) {
        super(props, "Certificate information", "", false);
    }

    private static certificateNameToHtml(name: import("@autobet/autobetlib").CertificateName): JSX.Element {
        return (
            <p style={{marginLeft: '10px'}}>
                Country: {name.country || <i>unset</i>}<br/>
                State: {name.state || <i>unset</i>}<br/>
                Locality: {name.locality || <i>unset</i>}<br/>
                Organization: {name.organization || <i>unset</i>}<br/>
                Organizational unit: {name.organizational_unit || <i>unset</i>}<br/>
                E-mail address: {name.email || <i>unset</i>}<br/>
                Common name: {name.common_name || <i>unset</i>}<br/>
                User id: {name.user_id || <i>unset</i>}<br/>
            </p>
        );
    }

    public show(certificate: import("@autobet/autobetlib").CertificateInfo): void {
        const headingStyle: CSSProperties = {
            fontWeight: 'bold',
            fontSize: '1.5em',
            margin: '10px 0'
        };

        this.setText(
            <>
                <p style={headingStyle}>Issuer</p>
                {CertificateInfoDialog.certificateNameToHtml(certificate.issuer)}
                <p style={headingStyle}>Subject</p>
                {CertificateInfoDialog.certificateNameToHtml(certificate.subject)}
            </>
        );
        this.open();
    }
}
import React from "react";
import Loadable from "../Loadable";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {Checkbox} from "@mui/material";
import StaticInstances from "../../../util/StaticInstances";

interface SSLSupportState {
    checked: boolean;
    disabled: boolean;
}

export default class SSLSupport extends React.Component<{}, SSLSupportState> implements Loadable {
    private interval: NodeJS.Timer | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            checked: false,
            disabled: false
        };
    }

    public set disabled(val: boolean) {
        this.setState({
            disabled: val
        });
    }

    public async loadData(): Promise<void> {
        if (!window.autobet.settings.webServerRunning()) {
            this.setState({
                checked: await window.autobet.maySupportHttps()
            });
        }
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>SSL Enabled</ContainerHeading>
                        <InfoIcon title="SSL Support">
                            This will be checked if ssl is enabled. This value is updated every 60 seconds only if the
                            web server is stopped. If this is checked, the web server will start with https enabled, so
                            make sure to add 'https://' to your request to access the web ui. In order for ssl to be
                            enabled, you must place two certificate files, the one containing the private key named
                            'ssl_private.pem', the other one, containing the public key named 'ssl_public.pem', in the
                            following folder 'YOUR_USERS_DOCUMENTS_FOLDER/autobet'. Both files must be valid
                            certificate files and the private key file must not be encrypted. Click the checkmark icon
                            to get further information about the certificates.
                        </InfoIcon>
                    </InfoAlign>

                    <div style={{margin: 'auto'}}>
                        <Checkbox checked={this.state.checked} disabled={this.state.disabled}
                                  onClick={this.onClick.bind(this)}/>
                    </div>
                </TextAlign>
            </SettingContainer>
        );
    }

    public override componentDidMount(): void {
        this.interval = setInterval(this.loadData.bind(this), 60000);
        this.loadData().then();
    }

    public override componentWillUnmount(): void {
        if (this.interval != null) {
            clearInterval(this.interval);
        }
    }

    private async onClick(): Promise<void> {
        StaticInstances.loadingCertificateAlert?.show();
        this.disabled = true;
        const cert = await window.autobet.getCertificateInfo();
        StaticInstances.loadingCertificateAlert?.hide();
        this.disabled = false;
        StaticInstances.certificateInfoDialog?.show(cert);
    }
}
import React from "react";
import { Alert, AlertColor, AlertTitle, Collapse, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

interface CustomAlertProps {
    title?: string;
    severity?: AlertColor;
    closeable?: boolean;
}

interface CustomAlertState {
    visible: boolean;
    text?: string | undefined | null;
}

export default class CustomAlert extends React.Component<CustomAlertProps, CustomAlertState> {
    private timeout: NodeJS.Timeout | null = null;

    public constructor(props: CustomAlertProps) {
        super(props);

        this.state = {
            visible: false
        };
    }

    public set visible(val: boolean) {
        this.setState({
            visible: val
        });
    }

    public get visible(): boolean {
        return this.state.visible;
    }

    public show(timeout?: number): void {
        const makeVisible = (): void => {
            this.visible = true;

            if (this.timeout != null) {
                clearInterval(this.timeout);
                this.timeout = null;
            }

            if (timeout) {
                this.timeout = setTimeout(this.hide.bind(this), timeout);
            }
        };

        if (this.visible) {
            this.hide();
            setTimeout(makeVisible, 250);
        } else {
            makeVisible();
        }
    }

    public hide(): void {
        this.visible = false;

        if (this.timeout != null) {
            clearInterval(this.timeout);
            this.timeout = null;
        }
    }

    public setText(text: string | null) {
        this.setState({
            text: text
        });
    }

    public override render() {
        return (
            <Collapse in={this.state.visible}>
                <Alert severity={this.props.severity} action={
                    this.props.closeable ?
                        <IconButton aria-label="close" color="inherit" size="small" onClick={() => this.visible = false}>
                            <CloseIcon fontSize="inherit" />
                        </IconButton> : undefined
                } style={{ marginTop: '10px' }}>
                    {this.props.title ? <AlertTitle>{this.props.title}</AlertTitle> : undefined}
                    {this.state.text || this.props.children}
                </Alert>
            </Collapse>
        );
    }
}
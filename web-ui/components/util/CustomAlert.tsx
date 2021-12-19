import React from "react";
import {Alert, AlertColor, AlertTitle, Collapse, IconButton} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

interface CustomAlertProps {
    title?: string;
    severity?: AlertColor;
    closeable?: boolean;
}

interface CustomAlertState {
    visible: boolean;
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

    public show(timeout?: number): void {
        this.visible = true;

        if (this.timeout != null) {
            clearInterval(this.timeout);
            this.timeout = null;
        }

        if (timeout) {
            this.timeout = setTimeout(this.hide.bind(this), timeout);
        }
    }

    public hide(): void {
        this.visible = false;

        if (this.timeout != null) {
            clearInterval(this.timeout);
            this.timeout = null;
        }
    }

    public override render() {
        return (
            <Collapse in={this.state.visible}>
                <Alert severity={this.props.severity} action={
                    this.props.closeable ?
                    <IconButton aria-label="close" color="inherit" size="small" onClick={() => this.visible = false}>
                        <CloseIcon fontSize="inherit" />
                    </IconButton> : undefined
                } style={{marginTop: '10px'}}>
                    {this.props.title ? <AlertTitle>{this.props.title}</AlertTitle> : undefined}
                    {this.props.children}
                </Alert>
            </Collapse>
        );
    }
}
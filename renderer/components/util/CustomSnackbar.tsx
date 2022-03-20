import React from "react";
import {AlertColor, Collapse, Snackbar} from "@mui/material";

interface CustomSnackbarProps {
    severity?: AlertColor;
    buttons: React.ReactNode
}

interface CustomSnackbarState {
    visible: boolean;
    text?: string | undefined | null;
}

export default class CustomSnackbar extends React.Component<CustomSnackbarProps, CustomSnackbarState> {
    private timeout: NodeJS.Timeout | null = null;

    public constructor(props: CustomSnackbarProps) {
        super(props);

        this.state = {
            visible: false
        };
    }

    public get visible(): boolean {
        return this.state.visible;
    }

    public set visible(val: boolean) {
        this.setState({
            visible: val
        });
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
                <Snackbar open={this.state.visible} onClose={() => this.visible = false} style={{marginTop: '10px'}}
                          action={this.props.buttons} anchorOrigin={{vertical: "bottom", horizontal: "center"}}
                          message={this.state.text}
                          sx={{display: 'block', position: 'relative', marginBottom: '-24px'}}/>
            </Collapse>
        );
    }
}
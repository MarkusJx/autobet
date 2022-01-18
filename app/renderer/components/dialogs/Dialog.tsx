import React from "react";
import {Dialog, Button, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";

type TextType = JSX.Element | JSX.Element[] | string;

interface DialogProps {
    title: string;
    children: TextType;
    cancelText?: string;
    okText?: string;
}

export default interface DialogState {
    open: boolean;
    text?: TextType;
}

export class DialogElement extends React.Component<DialogProps, DialogState> {
    private static lastId: number = 0;

    public constructor(props: DialogProps) {
        super(props);

        this.state = {
            open: false
        };
    }

    public override render(): React.ReactNode {
        const id = DialogElement.lastId++;
        return (
            <Dialog open={this.state.open} onClose={this.close.bind(this)}
                    aria-labelledby={`${id}-dialog-title`}
                    aria-describedby={`${id}-dialog-description`}>
                <DialogTitle id={`${id}-dialog-title`}>
                    {this.props.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id={`${id}-dialog-description`}>
                        {this.state.text || this.props.children}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close.bind(this)}>
                        {this.props.cancelText || "Cancel"}
                    </Button>
                    <Button onClick={this.close.bind(this)} autoFocus>
                        {this.props.okText || "Ok"}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    public open(): void {
        this.setState({
            open: true
        });
    }

    public close(): void {
        this.setState({
            open: false
        })
    }

    public setText(text: TextType | undefined) {
        this.setState({
            text: text
        });
    }
}

export abstract class ADialog extends React.Component<any, any> {
    protected dialog: DialogElement | null = null;

    protected constructor(
        props: any,
        private readonly title: string,
        private readonly text: JSX.Element | JSX.Element[] | string,
        private readonly cancelText?: string,
        private readonly okText?: string
    ) {
        super(props);
    }

    public override render(): React.ReactNode {
        return (
            <DialogElement title={this.title} cancelText={this.cancelText} okText={this.okText}
                           ref={e => this.dialog = e}>
                {this.text}
            </DialogElement>
        );
    }

    public open(): void {
        this.dialog?.open();
    }

    public close(): void {
        this.dialog?.close();
    }

    public setText(text: TextType | undefined): void {
        this.dialog?.setText(text);
    }
}
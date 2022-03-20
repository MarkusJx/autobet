import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";

export type TextType = JSX.Element | JSX.Element[] | string;

type CloseCallback = (action: CloseAction) => void;

interface DialogProps {
    title: string;
    children: TextType;
    cancelButton?: boolean;
    cancelText?: string;
    okText?: string;
    onClose: CloseCallback | null;
}

export default interface DialogState {
    open: boolean;
    title?: string;
    text?: TextType;
}

export type CloseAction = "ok" | "cancel";

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
                    {this.state.title || this.props.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id={`${id}-dialog-description`}>
                        {this.state.text || this.props.children}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {
                        this.props.cancelButton != false ?
                            <Button onClick={this.close.bind(this, "cancel")}>
                                {this.props.cancelText || "Cancel"}
                            </Button> : undefined
                    }
                    <Button onClick={this.close.bind(this, "ok")}>
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

    public close(action: CloseAction): void {
        this.setState({
            open: false
        });
        if (this.props.onClose) this.props.onClose(action);
    }

    public setText(text: TextType | undefined): void {
        this.setState({
            text: text
        });
    }

    public setTitle(title: string | undefined): void {
        this.setState({
            title: title
        });
    }
}

export abstract class ADialog extends React.Component<any, any> {
    protected dialog: DialogElement | null = null;

    protected constructor(
        props: any,
        private readonly title: string = "",
        private readonly text: JSX.Element | JSX.Element[] | string = "",
        private readonly cancelButton?: boolean,
        private readonly onClose: CloseCallback | null = null,
        private readonly cancelText?: string,
        private readonly okText?: string
    ) {
        super(props);
    }

    public override render(): React.ReactNode {
        return (
            <DialogElement title={this.title} cancelText={this.cancelText} okText={this.okText}
                           ref={e => this.dialog = e} cancelButton={this.cancelButton} {...this.props}
                           onClose={this.onClose}>
                {this.text || this.props.children as any}
            </DialogElement>
        );
    }

    public open(): void {
        this.dialog?.open();
    }

    public close(closeAction: CloseAction = "cancel"): void {
        this.dialog?.close(closeAction);
    }

    public setText(text: TextType | undefined): void {
        this.dialog?.setText(text);
    }

    public setTitle(title: string | undefined): void {
        this.dialog?.setTitle(title);
    }
}
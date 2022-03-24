import React from "react";
import {
    AppBar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Slide,
    Toolbar,
    Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "../../styles/components/util/Dialog.module.scss";

export type TextType = JSX.Element | JSX.Element[] | string;

type CloseCallback = (action: CloseAction) => void;

interface DialogProps {
    title: string;
    children: TextType;
    cancelButton?: boolean;
    cancelText?: string;
    okText?: string;
    onClose: CloseCallback | null;
    fullscreen?: boolean;
}

export default interface DialogState {
    open: boolean;
    title?: string;
    text?: TextType;
}

export type CloseAction = "ok" | "cancel";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} children={props.children as any} {...props}/>;
});

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

        let style: React.CSSProperties = {};
        if (this.props.fullscreen) {
            style = {
                marginTop: '28px',
                height: 'calc(100vh - 28px)'
            };
        }

        return (
            <Dialog open={this.state.open} onClose={this.close.bind(this)}
                    aria-labelledby={`${id}-dialog-title`}
                    aria-describedby={`${id}-dialog-description`}
                    fullScreen={this.props.fullscreen} style={style}
                    TransitionComponent={this.props.fullscreen ? Transition as any : undefined}>
                {this.getTitle(id)}
                <DialogContent style={this.props.fullscreen ? {padding: 0} : {}} className={styles.dialogContent}>
                    <DialogContentText id={`${id}-dialog-description`}>
                        {this.state.text || this.props.children}
                    </DialogContentText>
                </DialogContent>
                <DialogActions style={this.props.fullscreen ? {padding: 0} : {}}>
                    {
                        this.props.cancelButton != false ?
                            <Button onClick={this.close.bind(this, "cancel")}>
                                {this.props.cancelText || "Cancel"}
                            </Button> : undefined
                    }
                    {
                        this.props.fullscreen ? undefined :
                            <Button onClick={this.close.bind(this, "ok")}>
                                {this.props.okText || "Ok"}
                            </Button>
                    }
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

    private getTitle(id: number): React.ReactNode {
        if (this.props.fullscreen) {
            return (
                <AppBar sx={{position: 'relative'}}>
                    <Toolbar>
                        <IconButton edge="start" color="inherit"
                                    onClick={this.close.bind(this, this.props.cancelButton ? "cancel" : "ok")}
                                    aria-label="close">
                            <CloseIcon/>
                        </IconButton>
                        <Typography sx={{ml: 2, flex: 1}} variant="h6" component="div">
                            {this.state.title || this.props.title}
                        </Typography>
                        {
                            this.props.cancelButton ?
                                <Button autoFocus color="inherit" onClick={this.close.bind(this, "ok")}>
                                    {this.props.okText || "Ok"}
                                </Button> : undefined
                        }
                    </Toolbar>
                </AppBar>
            );
        } else {
            return (
                <DialogTitle id={`${id}-dialog-title`}>
                    {this.state.title || this.props.title}
                </DialogTitle>
            );
        }
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
        private readonly okText?: string,
        private readonly fullscreen?: boolean
    ) {
        super(props);
    }

    public override render(): React.ReactNode {
        return (
            <DialogElement title={this.title} cancelText={this.cancelText} okText={this.okText}
                           ref={e => this.dialog = e} cancelButton={this.cancelButton} {...this.props}
                           onClose={this.onClose} fullscreen={this.fullscreen}>
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
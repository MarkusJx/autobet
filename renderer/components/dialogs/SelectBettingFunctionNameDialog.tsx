import {ADialog, CloseAction} from "./Dialog";
import {TextField} from "@mui/material";
import React from "react";

class SelectBettingFunctionNameDialogElement extends ADialog {
    public constructor(props: {}) {
        super(props, "Name your implementation", "", true, action => this._onClose(action));
    }

    public _onClose: (action: CloseAction) => void = () => {
    };
}

interface SelectBettingFunctionNameDialogState {
    value: string;
    invalid: boolean;
    errorMessage: string;
}

export default class SelectBettingFunctionNameDialog extends React.Component<{}, SelectBettingFunctionNameDialogState> {
    private element?: SelectBettingFunctionNameDialogElement;

    public constructor(props: {}) {
        super(props);

        this.state = {
            value: "",
            invalid: false,
            errorMessage: ""
        };
    }

    public get value(): string {
        return this.state.value;
    }

    public setInvalid(val: boolean, errorMessage: string): void {
        this.setState({
            invalid: val,
            errorMessage: errorMessage
        });
    }

    public override render(): React.ReactNode {
        return (
            <SelectBettingFunctionNameDialogElement ref={e => this.element = e!}>
                <TextField id="add-impl-text-field" label="Name" variant="outlined" value={this.value}
                           onChange={e => this.setState({value: e.target.value})} style={{marginTop: '5px'}}
                           error={this.state.invalid} helperText={this.state.errorMessage}/>
            </SelectBettingFunctionNameDialogElement>
        );
    }

    public componentDidMount(): void {
        this.element!._onClose = action => {
            this.setInvalid(false, "");
            if (action === "ok") {
                this.closeListener(this.value);
            }
        };
    }

    public open(closeListener: (value: string) => void): void {
        this.setState({value: ""});
        this.closeListener = closeListener;
        this.element?.open();
    }

    private closeListener: (value: string) => void = () => {
    };
}
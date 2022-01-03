import React from "react";
import {Backdrop, CircularProgress} from "@mui/material";

interface LoadingBackdropState {
    open: boolean;
}

export default class LoadingBackdrop extends React.Component<{}, LoadingBackdropState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            open: false
        };
    }

    public setOpen(val: boolean): void {
        this.setState({
            open: val
        });
    }

    public override render() {
        return (
            <Backdrop sx={{ color: '#fff', zIndex: 998 }} open={this.state.open}>
                <CircularProgress color="inherit" />
            </Backdrop>
        );
    }
}
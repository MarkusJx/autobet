import React from "react";
import {ContainerComponent, ContainerHeading, TextAlign} from "../Container";
import LoadingButton from '@mui/lab/LoadingButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

interface ControlsState {
    start: boolean;
    loading: boolean;
}

export default class Controls extends React.Component<{}, ControlsState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            start: true,
            loading: false
        };
    }

    public override render() {
        return (
            <ContainerComponent>
                <TextAlign>
                    <ContainerHeading>
                        Controls
                    </ContainerHeading>
                    <LoadingButton onClick={this.onClick.bind(this)}
                                   endIcon={this.state.start ? <PlayArrowIcon/> : <StopIcon/>}
                                   loading={this.state.loading} loadingPosition="end" variant="contained"
                                   style={{height: 'max-content', margin: 'auto'}}>
                        {this.state.start ? "Start" : "Stop"}
                    </LoadingButton>
                </TextAlign>
            </ContainerComponent>
        );
    }

    private onClick(): void {
        // TODO
    }
}
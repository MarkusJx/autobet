import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {TextField} from "@mui/material";
import textFieldStyle from "./textFieldStyle";

export default class TimeSleep extends React.Component<any, any> {
    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>Sleep time</ContainerHeading>
                        <InfoIcon title="Time to sleep until the race has finished">
                            Set the time to sleep after a bet has started. Use this option, when the program did not
                            immediately start a new bet when the race has finished. Press enter to save, the default
                            value is 36.
                        </InfoIcon>
                    </InfoAlign>

                    <TextField inputProps={{
                        inputMode: 'numeric', pattern: '[0-9]*', type: 'number', min: '1', max: '10000'
                    }} variant="filled" label="Time" style={textFieldStyle}/>
                </TextAlign>
            </SettingContainer>
        );
    }
}
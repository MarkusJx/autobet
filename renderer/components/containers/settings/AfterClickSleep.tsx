import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {TextField} from "@mui/material";
import textFieldStyle from "./textFieldStyle";

export default class AfterClickSleep extends React.Component<any, any> {
    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>After click sleep</ContainerHeading>
                        <InfoIcon title="Time to sleep after click">
                            Set the time to sleep after a button is pressed. Increase this value if button clicks are
                            not recognized by the game. Press enter to save.
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
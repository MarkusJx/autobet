import React from "react";
import SettingContainer from "./SettingContainer";
import {ContainerHeading, TextAlign} from "../../Container";
import {InfoAlign, InfoIcon} from "./Info";
import {TextField} from "@mui/material";
import textFieldStyle from "./textFieldStyle";

export default class ClickSleep extends React.Component<any, any> {
    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>Click sleep</ContainerHeading>
                        <InfoIcon title="Button click sleep time">
                            Set the time to sleep between a button is pressed and then released. Increase this value if
                            button clicks are not recognized by the game. Press enter to save.
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
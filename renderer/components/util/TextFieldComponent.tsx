import React from "react";
import {TextType} from "../dialogs/Dialog";
import {InputBaseComponentProps, TextField} from "@mui/material";
import SettingContainer from "../containers/settings/SettingContainer";
import {ContainerHeading, TextAlign} from "../Container";
import {InfoAlign, InfoIcon} from "../containers/settings/Info";
import textFieldStyle from "../containers/settings/textFieldStyle";
import StaticInstances from "../../util/StaticInstances";
import Loadable from "../containers/Loadable";

export function numericInputProps(min: number, max: number): InputBaseComponentProps {
    return {
        inputMode: 'numeric', pattern: '[0-9]*', type: 'number', min, max
    };
}

interface TextFieldComponentState<T> {
    disabled: boolean;
    value: T;
}

export default abstract class TextFieldComponent<T> extends React.Component<{}, TextFieldComponentState<T>> implements Loadable {
    protected constructor(
        private readonly heading: string,
        private readonly textFieldTitle: string,
        private readonly infoTitle: string,
        private readonly infoText: TextType,
        private readonly inputProps: InputBaseComponentProps,
        initialValue: T, props: {}
    ) {
        super(props);

        this.state = {
            disabled: false,
            value: initialValue
        };
    }

    public set disabled(val: boolean) {
        this.setState({
            disabled: val
        });
    }

    protected get value(): T {
        return this.state.value;
    }

    protected set value(val: T) {
        this.setState({
            value: val
        });
    }

    public override render(): React.ReactNode {
        return (
            <SettingContainer>
                <TextAlign>
                    <InfoAlign>
                        <ContainerHeading>{this.heading}</ContainerHeading>
                        <InfoIcon title={this.infoTitle}>
                            {this.infoText}
                        </InfoIcon>
                    </InfoAlign>

                    <TextField value={this.value} onChange={this.onChangeEvent.bind(this)}
                               onKeyUp={this.onKeyUpEvent.bind(this)}
                               onBlur={this.onFocusLoss.bind(this)} inputProps={this.inputProps} variant="filled"
                               label={this.textFieldTitle} style={textFieldStyle} disabled={this.state.disabled}/>
                </TextAlign>
            </SettingContainer>
        );
    }

    public async loadData(): Promise<void> {
        this.value = await this.getStoredValue();
    }

    /**
     * Called when the value is changed
     *
     * @param value the new value, must be parsed
     * @return the parsed value or null if the value is invalid
     * @protected
     */
    protected abstract onChange(value: any): T | null;

    /**
     * Called when enter is pressed on the text field.
     * Return true if the value is accepted.
     * @protected
     */
    protected abstract onEnterPressed(): Promise<boolean>;

    /**
     * Get the stored value from the backend
     * @protected
     */
    protected abstract getStoredValue(): Promise<T>;

    private onChangeEvent(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const converted = this.onChange(event.target.value);
        if (converted !== null) {
            this.value = converted;
        }
    }

    private async onKeyUpEvent(event: React.KeyboardEvent<HTMLDivElement>): Promise<void> {
        if (event.key === "Enter") {
            this.disabled = true;
            if (await this.onEnterPressed()) {
                StaticInstances.settingsDiscardedAlert?.hide();
                StaticInstances.settingsSavedAlert?.show(5000);
            } else {
                await this.loadData();
            }
            this.disabled = false;
        }
    }

    private async onFocusLoss(): Promise<void> {
        const lastVal = await this.getStoredValue();
        if (this.value !== lastVal && !this.state.disabled) {
            this.value = lastVal;
            StaticInstances.settingsDiscardedAlert?.show(5000);
        }
    }
}
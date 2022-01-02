import React from "react";
import {ClassNameProps, ContainerComponent} from "../../Container";
import styles from "../../../../styles/components/containers/settings/SettingContainer.scss";

export default function SettingContainer(props: ClassNameProps) {
    return (
        <ContainerComponent className={`${styles.settingContainer} ${props.className || ""}`}>
            {props.children}
        </ContainerComponent>
    );
}
import React from "react";
import {ContainerComponent, ContainerText} from "./Container";
import styles from "../styles/components/SettingsDivider.module.scss";

export default function SettingsDivider(): JSX.Element {
    return (
        <ContainerComponent className={styles.container}>
            <ContainerText className={styles.text}>
                Settings
            </ContainerText>
        </ContainerComponent>
    );
}
import React from "react";
import {ClassNameProps} from "../../Container";
import * as MuiInfoIcon from '@mui/icons-material/Info';
import styles from "../../../styles/components/containers/settings/Info.module.scss";
import StaticInstances from "../../../util/StaticInstances";
import {TextType} from "../../dialogs/Dialog";

export function InfoAlign(props: ClassNameProps): JSX.Element {
    return (
        <div className={`${styles.infoAlign} ${props.className || ""}`}>
            {props.children}
        </div>
    );
}

interface InfoIconProps extends ClassNameProps {
    title: string;
    children: TextType;
}

export function InfoIcon(props: InfoIconProps): JSX.Element {
    const openDialog = () => {
        StaticInstances.infoDialog?.setInfoTextAndOpen(props.title, props.children);
    };

    return (
        <MuiInfoIcon.default className={`${styles.infoIcon} ${props.className || ""}`} onClick={openDialog}/>
    );
}
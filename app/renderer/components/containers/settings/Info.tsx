import React from "react";
import {ClassNameProps} from "../../Container";
import * as MuiInfoIcon from '@mui/icons-material/Info';
import styles from "../../../../styles/components/containers/settings/Info.scss";

export function InfoAlign(props: ClassNameProps): JSX.Element {
    return (
        <div className={`${styles.infoAlign} ${props.className || ""}`}>
            {props.children}
        </div>
    );
}

export function InfoIcon(props: ClassNameProps): JSX.Element {
    return (
        <MuiInfoIcon.default className={`${styles.infoIcon} ${props.className || ""}`}/>
    );
}
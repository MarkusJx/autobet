import styles from "../../styles/components/StatusText.module.scss";
import React from "react";

interface StatusTextProps {
    text: string;
    outlined?: boolean;
    underlined?: boolean;
    color?: "red" | "yellow" | "green" | "white"
}

export default function StatusText(props: StatusTextProps): JSX.Element {
    let color: string = "";
    if (props.color) {
        color = styles[props.color];
    }

    const classname = `${styles.textBackdrop} ${color} ${props.outlined ? styles.outline : ""} 
                        ${props.underlined ? styles.underline : ""}`;
    return (
        <div>
            <h2 className={classname}>
                {props.text}
            </h2>
        </div>
    );
}
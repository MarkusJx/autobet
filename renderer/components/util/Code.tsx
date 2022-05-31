import React from "react";
import styles from "../../styles/components/util/Code.module.scss";
import {TextType} from "../dialogs/Dialog";

export default class Code extends React.Component<{ children?: any }, {}> {
    public static create(text: TextType): React.CElement<{}, Code> {
        return React.createElement(Code, null, text);
    }

    public override render(): React.ReactNode {
        return (
            <span className={styles.code}>
                {this.props.children}
            </span>
        );
    }
}
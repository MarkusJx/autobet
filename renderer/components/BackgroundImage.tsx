import React from "react";
import styles from "../styles/components/BackgroundImage.module.scss";

export default class BackgroundImage extends React.Component {
    public override render(): React.ReactNode {
        return (
            <>
                <div className={styles.backgroundImage}/>
                {this.props.children}
            </>
        );
    }
}
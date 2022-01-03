import React from "react";
import styles from "../styles/components/Title.module.scss";

/**
 * The app title
 */
export default class Title extends React.Component {
    public override render(): React.ReactNode {
        return (
            <div className={styles.title}>
                <h1>Autobet</h1>
                <h3>A simple GTA Online horse racing betting bot</h3>
            </div>
        );
    }
}
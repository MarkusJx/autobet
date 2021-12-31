import React from "react";
import Background from "../../web/mountains.svg";
import styles from "../../styles/components/BackgroundImage.module.scss";

export default class BackgroundImage extends React.Component {
    public override render(): React.ReactNode {
        return (
            <div>
                <img src={Background} alt="Background image" className={styles.backgroundImage}/>
                {this.props.children}
            </div>
        );
    }
}
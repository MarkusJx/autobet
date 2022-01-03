import React from "react";
import styles from "../../styles/components/Container.module.scss";

interface ContainerProps {
    heading: string;
    children?: JSX.Element[] | JSX.Element;
}

export default function Container(props: ContainerProps) {
    return (
        <div className={styles.container}>
            <h2>
                {props.heading}
            </h2>
            <div>
                {props.children}
            </div>
        </div>
    );
}
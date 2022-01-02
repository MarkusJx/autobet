import React from "react";
import styles from "../../styles/components/Container.module.scss";

export interface ClassNameProps {
    className?: string;
    children?: any;
}

export function ContainerComponent(props: ClassNameProps): JSX.Element {
    return (
        <div className={`${styles.container} ${props.className || ""}`}>
            {props.children}
        </div>
    );
}

export function TextAlign(props: ClassNameProps): JSX.Element {
    return (
        <div className={`${styles.textAlign} ${props.className || ""}`}>
            {props.children}
        </div>
    );
}

export function ContainerHeading(props: ClassNameProps): JSX.Element {
    return (
        <h1 className={`${styles.text} ${styles.heading} ${props.className || ""}`}>
            {props.children}
        </h1>
    );
}

export function ContainerText(props: ClassNameProps): JSX.Element {
    return (
        <h2 className={`${styles.text} ${styles.mainText} ${props.className || ""}`}>
            {props.children}
        </h2>
    );
}

interface ContainerProps {
    className?: string;
    heading: string;
    text: string;
    textClass?: string;
}

export default class Container extends React.Component<ContainerProps> {
    public override render(): React.ReactNode {
        return (
            <ContainerComponent className={this.props.className || ""}>
                <TextAlign>
                    <ContainerHeading>
                        {this.props.heading}
                    </ContainerHeading>
                    <ContainerText className={this.props.textClass || styles.mainColor}>
                        {this.props.text}
                    </ContainerText>
                </TextAlign>
            </ContainerComponent>
        );
    }
}
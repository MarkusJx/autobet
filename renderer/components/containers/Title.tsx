import React from "react";
import containerStyles from "../../styles/components/Container.module.scss";
import styles from "../../styles/components/containers/Title.module.scss";
import StaticInstances from "../../util/StaticInstances";

interface TitleState {
    hovered: boolean;
    version?: string;
}

export default class Title extends React.Component<{}, TitleState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            hovered: false
        };
    }

    public override render(): React.ReactNode {
        return (
            <div
                className={`${containerStyles.container} ${styles.titleContainer} ${this.state.hovered ? styles.hovered : ""}`}
                onMouseEnter={this.mouseOver.bind(this)} onMouseLeave={this.mouseLeave.bind(this)}>
                <h1 className={styles.title}>Welcome to Autobet</h1>
                <p className={styles.description}>A GTA Online Horse Racing betting bot.</p>
                <p className={styles.version}>Version {this.state.version || "unknown"}</p>
                <p className={styles.copyright}>
                    © MarkusJx 2022.
                    <span className={styles.opener} onClick={() => StaticInstances.licenseViewerDialog?.open()}>
                        Licensed under the MIT License.
                    </span>
                </p>
            </div>
        );
    }

    public override componentDidMount(): void {
        window.util.getVersion().then((ver: string) => {
            this.setState({
                version: ver
            });
        });
    }

    private mouseOver(): void {
        this.setState({
            hovered: true
        });
    }

    private mouseLeave(): void {
        this.setState({
            hovered: false
        });
    }
}
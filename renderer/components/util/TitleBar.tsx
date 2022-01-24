import dynamic from "next/dynamic";
import React from "react";
import icon from "../../../icon.png";

const FramelessTitleBar = dynamic(import("frameless-titlebar"), {
    ssr: false
});

interface TitleBarState {
    maximized: boolean
}

export default class TitleBar extends React.Component<{}, TitleBarState> {
    public constructor(props: {}) {
        super(props);

        this.onMaximized = this.onMaximized.bind(this);
        this.onRestore = this.onRestore.bind(this);
        this.handleMaximize = this.handleMaximize.bind(this);

        this.state = {
            maximized: false
        };
    }

    private set maximized(val: boolean) {
        this.setState({
            maximized: val
        });
    }

    public override render(): React.ReactNode {
        return (
            <FramelessTitleBar title="Autobet"
                               onMaximize={this.handleMaximize}
                               onClose={() => window.electronWindow.close()}
                               onMinimize={() => window.electronWindow.minimize()}
                               onDoubleClick={this.handleMaximize}
                               disableMinimize={false}
                               disableMaximize={false}
                               maximized={this.state.maximized}
                               iconSrc={icon.src}/>
        );
    }

    public override async componentDidMount(): Promise<void> {
        window.electronWindow.onMaximize(this.onMaximized);
        window.electronWindow.onRestore(this.onRestore);
        this.maximized = await window.electronWindow.isMaximized();
    }

    private onMaximized(): void {
        this.maximized = true;
    }

    private onRestore(): void {
        this.maximized = false;
    }

    private handleMaximize(): void {
        if (this.state.maximized) {
            window.electronWindow.restore();
        } else {
            window.electronWindow.maximize();
        }
    }
}

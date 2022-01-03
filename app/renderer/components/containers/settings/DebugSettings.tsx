import React from "react";
import {LogViewer, LogViewerSearch} from "@patternfly/react-log-viewer";
import {Toolbar, ToolbarContent, ToolbarItem} from "@patternfly/react-core";
import SettingContainer from "./SettingContainer";
import styles from "../../../../styles/components/containers/settings/DebugSettings.module.scss";
import "@patternfly/patternfly/patternfly.scss";
import "@patternfly/patternfly/patternfly-addons.scss";
import "@patternfly/react-log-viewer/dist/esm/LogViewer/"

function ToolbarElement(): JSX.Element {
    return (
        <Toolbar>
            <ToolbarContent>
                <ToolbarItem>
                    <LogViewerSearch placeholder="Search" minSearchChars={1}/>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    );
}

export default class DebugSettings extends React.Component<any, any> {
    public override render(): React.ReactNode {
        return (
            <SettingContainer className={styles.container}>
                <div className={styles.logViewerContainer}>
                    <LogViewer theme="dark" hasLineNumbers height={300} data={"data.data"}
                        /*toolbar={<ToolbarElement/>} hasToolbar*//>
                </div>
            </SettingContainer>
        );
    }
}
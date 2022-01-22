import React from "react";
import styles from "../../../styles/components/containers/settings/CustomBettingFunction.module.scss";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-chrome";

interface BettingFunctionEditorState {
    drawerOpen: boolean;
}

export default function WrappedBettingFunctionEditor({editorRef, ...props}: { editorRef: any }) {
    return <BettingFunctionEditor {...props} ref={editorRef}/>;
}

export class BettingFunctionEditor extends React.Component<{}, BettingFunctionEditorState> {
    public editor: AceEditor | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            drawerOpen: false
        };
    }

    public override render(): React.ReactNode {
        return (
            <AceEditor mode="java" theme="chrome" name="code-editor"
                       className={`${styles.editor} ${this.state.drawerOpen && styles.drawerOpen}`}
                       style={{width: 'auto'}} ref={e => this.editor = e}/>
        );
    }

    public setDrawerOpen(val: boolean): void {
        this.setState({
            drawerOpen: val
        }, () => {
            this.editor?.forceUpdate();
        });
    }
}
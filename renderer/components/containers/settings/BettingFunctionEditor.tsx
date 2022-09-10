import React from "react";
import styles from "../../../styles/components/containers/settings/CustomBettingFunction.module.scss";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-chrome";

interface BettingFunctionEditorState {
    drawerOpen: boolean;
}

export interface BettingFunctionEditorProps {
    defaultValue: string;
}

export default function WrappedBettingFunctionEditor({
                                                         editorRef,
                                                         ...props
                                                     }: { editorRef: any } & BettingFunctionEditorProps) {
    return <BettingFunctionEditor {...props} ref={editorRef}/>;
}

export class BettingFunctionEditor extends React.Component<BettingFunctionEditorProps, BettingFunctionEditorState> {
    public editor: AceEditor | null = null;

    public constructor(props: BettingFunctionEditorProps) {
        super(props);

        this.state = {
            drawerOpen: false
        };
    }

    public override render(): React.ReactNode {
        return (
            <AceEditor mode="javascript" theme="chrome" name="code-editor"
                       className={`${styles.editor} ${this.state.drawerOpen && styles.drawerOpen}`}
                       style={{width: 'auto'}} ref={e => this.editor = e} defaultValue={this.props.defaultValue}/>
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
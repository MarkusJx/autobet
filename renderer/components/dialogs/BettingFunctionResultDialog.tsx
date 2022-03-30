import {ADialog} from "./Dialog";
import SyntaxHighlighter from 'react-syntax-highlighter';
import {nightOwl} from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import {err_res, test_res_arr} from "../../../electron-src/preload/IsolatedFunction";

export default class BettingFunctionResultDialog extends ADialog {
    public constructor(props: {}) {
        super(props, "Betting Function Test Result", "", false);
    }

    public setResult(obj: (err_res | { stack: string[] }) | test_res_arr): void {
        if ((obj as err_res).stack) {
            (obj as err_res | { stack: string[] }).stack = (obj as err_res).stack.split("\n").map(s => s.trim());
        }

        this.setText(<SyntaxHighlighter language="json" style={nightOwl}
                                        customStyle={{
                                            width: '550px',
                                            borderRadius: '5px',
                                            userSelect: 'text',
                                            maxWidth: '100%'
                                        }}>
            {JSON.stringify(obj, undefined, 2)}
        </SyntaxHighlighter>);
    }
}
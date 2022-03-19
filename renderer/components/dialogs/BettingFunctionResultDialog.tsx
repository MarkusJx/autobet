import {ADialog} from "./Dialog";
import SyntaxHighlighter from 'react-syntax-highlighter';
import {dark} from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {err_res, test_res_arr} from "../../util/isolatedFunction";

export default class BettingFunctionResultDialog extends ADialog {
    public constructor(props: {}) {
        super(props, "Betting Function Test Result", "", false);
    }

    public setResult(obj: err_res | test_res_arr): void {
        this.setText(<SyntaxHighlighter language="json" style={dark}>
            {JSON.stringify(obj, undefined, 2)}
        </SyntaxHighlighter>);
    }
}
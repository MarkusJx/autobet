import * as constants from "./jsEditorConstants";
import * as isolatedFunctions from "./isolatedFunctions";
import {functionStore} from "./functionStore";

/**
 * Show the message snackbar
 * 
 * @param text the text to show in the snackbar
 * @param extended_info the info displayed in the info dialog
 */
export function showMessageSnackbar(text: string, extended_info: string = "Not available"): void {
    constants.error_dialog.close();
    constants.error_dialog_text.innerHTML = extended_info;
    constants.message_snackbar.close();
    constants.message_snackbar_label.innerText = text;
    constants.message_snackbar.open();
}

/**
 * Highlight syntax of an object.
 * Source: https://stackoverflow.com/a/7220510
 * 
 * @param json the object to highlight
 */
export function syntaxHighlight(json: string | object): string {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls: string = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

/**
 * Set the editor disabled
 * 
 * @param val if set to true, the editor will be disabled
 */
export function setEditorDisabled(val: boolean): void {
    constants.editor.setReadOnly(val);
    // Cast the editor to any as ace.editor by default has no 'textInput' property
    (constants.editor as any).textInput.getElement().disabled = val;
}

/**
 * Save all functions
 */
export function saveAllFunctions(): void {
    const fns: functionStore[] = [];
    // Skip the first one as it is the standard implementation
    for (let i: number = 1; i < constants.buttons.length; i++) {
        fns.push(constants.buttons[i].fn);
    }

    isolatedFunctions.saveFunctions(fns);
}
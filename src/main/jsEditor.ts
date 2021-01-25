'use strict';

import { MDCRipple } from "@material/ripple";
import { MDCTopAppBar } from "@material/top-app-bar";

import { variables } from "./variables";
import { sidebarButton } from "./sidebarButton";
import { functionStore } from "./functionStore";
import * as utils from "./jsEditorUtils";
import * as constants from "./jsEditorConstants";
import * as isolatedFunctions from "./isolatedFunctions";

// Isolate the code in brackets, so names can be reused later, if needed
export function init(): void {
    const open_editor: HTMLElement = document.getElementById('open-editor'); // The show/hide editor button
    const editor_container: HTMLElement = document.getElementById('editor-container'); // The editor container
    const sidebar_buttons: HTMLElement = document.getElementById('editor-sidebar-buttons'); // The editor sidebar button container
    // The divider in the sidebar that should be hidden,
    // when there are no custom implementations saved
    const to_hide_divider: HTMLElement = document.getElementById('to-hide-divider');
    const editor_action_bar: HTMLElement = document.getElementById('editor-action-bar'); // The editor action bar

    // Attach a ripple to the open editor button
    MDCRipple.attachTo(open_editor);

    // Add the click event listener for the open_editor button
    open_editor.addEventListener('click', () => {
        // If the editor container is already opened, close it, open it otherwise
        if (editor_container.classList.contains("opened")) {
            editor_container.classList.remove("opened");
            document.getElementById('open-editor-button-label').innerText = "SHOW EDITOR";
        } else {
            editor_container.classList.add("opened");
            document.getElementById('open-editor-button-label').innerText = "HIDE EDITOR";
        }
    });

    // Set topAppBar options
    const topAppBar: MDCTopAppBar = new MDCTopAppBar(document.getElementById('editor-top-bar'));
    topAppBar.setScrollTarget(document.getElementById('editor-top-bar'));
    topAppBar.listen('MDCTopAppBar:nav', () => {
        // Add or remove the 'opened' attribute to the editor action bar
        // in order to hide it when there is no space for it available
        if (variables.drawer.open) {
            if (editor_action_bar.classList.contains("opened")) {
                editor_action_bar.classList.remove("opened");
            }
        } else {
            if (!editor_action_bar.classList.contains("opened")) {
                editor_action_bar.classList.add("opened");
            }
        }

        // Open / Close the drawer
        variables.drawer.open = !variables.drawer.open;
    });

    // Set ace options
    constants.editor.session.setMode("ace/mode/javascript");
    constants.editor.setTheme("ace/theme/chrome");
    // enable autocompletion and snippets
    constants.editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: false
    });

    // On changes made in the editor,
    // disable the check and set default buttons.
    // Cast the editor to any as ace.editor.getSession().on()
    // can't listen to 'change' by default
    (constants.editor as any).getSession().on('change', () => {
        if (variables.current_selected_impl != null) {
            constants.save_impl_button.disabled = variables.current_selected_impl.waiting;
            constants.check_impl_button.disabled = true;
            constants.set_default_button.disabled = true;
        }
    });

    constants.check_impl_button.addEventListener('click', () => {
        if (variables.current_selected_impl != null) {
            variables.current_selected_impl.checkFn();
        }
    });

    // Set the error message dialog opener
    document.getElementById('editor-message-snackbar-show-info').addEventListener('click', () => {
        constants.error_dialog.open();
    });

    /**
     * The default function example string
     */
    const default_fn: string = `// A js implementation of the native implementation may look like this:

// Convert an odd string such as '2/1'
// to a number, e.g. 2
function toNumber(val) {
    return Number(val.split('/')[0]);
}

// Main function
// Returns string, the odd of the horse to bet on,
// or null, if no bet should be placed
function run() {
    let containsEvens = odds.includes("evens");
    let lowest = null;

    for (let i = 0; i < odds.length; i++) {
        // Check if one probability >= 5/1 exists multiple times
        for (let j = i + 1; j < odds.length; j++) {
            // If odds[i] >= 5/1 exists multiple times, do not bet
            if ((odds[i] == "evens" || toNumber(odds[i]) <= 5) && odds[i] == odds[j])
                return null;
        }

        // If odds contains 'evens' and does also
        // contain another one >= 3/1, do not bet
        if (containsEvens && (odds[i] == "2/1" || odds[i] == "3/1"))
            return null;

        // Set the lowest odd
        if (!containsEvens && (lowest == null || toNumber(odds[i]) < toNumber(lowest))) {
            lowest = odds[i];
        }
    }

    // If the odds contain evens, this is the lowest
    if (containsEvens) {
        lowest = "evens";
    }

    // Return the lowest odd
    return lowest;
}

// Set the result.
// Set null if no bet should be placed,
// the odd of the horse to bet on otherwise
setResult(run());
`;

    // Set the revert callback
    isolatedFunctions.setRevertToDefaultCallback(() => {
        if (variables.current_default_button != null && variables.current_default_button.default) {
            variables.current_default_button.setDefault(false);
        } else {
            for (let i = 0; i < constants.buttons.length; i++) {
                constants.buttons[i].setDefault(false);
            }
        }

        default_button.setDefault(true);
    });

    // Set the default button
    const default_button: sidebarButton = new sidebarButton(document.getElementById("default-impl-button"), default_fn, "default", null, true);
    constants.buttons.push(default_button);

    // Set current_default_button and current_selected_impl to the default button
    variables.current_default_button = default_button;
    variables.current_selected_impl = default_button;

    // Open the default and set it to ok
    default_button.setOpened();
    default_button.setOk(true);
    to_hide_divider.style.visibility = "hidden";

    // Import the saved functions into the editor
    {
        let anyIsActive: boolean = false;

        // Iterate over the stored functions and add them to the ui
        let functions: functionStore[] = isolatedFunctions.getFunctions();
        for (let i = 0; i < functions.length; i++) {
            // Create a new sidebarButton
            let fn: sidebarButton = new sidebarButton(sidebar_buttons, functions[i].functionString, functions[i].name, functions[i]);
            fn.setOk(functions[i].ok);
            constants.buttons.push(fn);

            // If functions[i] is active, set fn as default
            if (functions[i].active) {
                fn.setDefault(true);
                anyIsActive = true;
                constants.message_snackbar.close();
            }
        }

        // If not any other is active, the default will be the active function
        if (!anyIsActive) {
            default_button.setDefault(true);
            constants.message_snackbar.close();
        }
    }

    // Add the click listener to the add button
    constants.add_button.addEventListener('click', () => {
        // Close the drawer and set the title
        variables.drawer.open = false;
        constants.editor_title.innerText = "Add implementation";

        // Empty the editor
        constants.editor.setValue("", -1);

        // Enable the delete and save button, disable the set default button.
        // The current selected implementation is set to null, enable the editor
        constants.save_impl_button.disabled = false;
        constants.delete_impl_button.disabled = false;
        constants.set_default_button.disabled = true;
        constants.check_impl_button.disabled = true;
        variables.current_selected_impl = null;
        utils.setEditorDisabled(false);
    });

    constants.save_impl_button.addEventListener('click', () => {
        if (variables.current_selected_impl == null) {
            // If current_selected_impl is null, open the name select dialog
            constants.select_name_dialog.open();
        } else {
            // Revert to default impl if to save == current
            if (variables.current_selected_impl.default) {
                default_button.setDefault(true);
                isolatedFunctions.revertToDefaultImpl();
            }

            constants.delete_impl_button.disabled = true;
            constants.save_impl_button.disabled = true;

            // Set the function string and check it for errors
            variables.current_selected_impl.setFunctionString(constants.editor.getValue());
            utils.saveAllFunctions();
            variables.current_selected_impl.checkFn();
        }
    });

    // Add the click listener to the set default button
    constants.set_default_button.addEventListener('click', () => {
        // Set the current selected imp as default
        // and disable the set default button
        variables.current_selected_impl.setDefault(true);
        constants.set_default_button.disabled = true;
        utils.saveAllFunctions();
    });

    // Add a click listener to the delete button
    constants.delete_impl_button.addEventListener('click', () => {
        // If we are currently adding a new implementation, empty the editor
        if (variables.current_selected_impl == null) {
            constants.editor.setValue("", -1);
        } else {
            // Remove the current impl from the buttons array
            let index: number = constants.buttons.indexOf(variables.current_selected_impl);
            constants.buttons.splice(index, 1);

            // If the current impl is the default,
            // set the native implementation as default
            if (variables.current_selected_impl.default) {
                default_button.setDefault(true);
                isolatedFunctions.revertToDefaultImpl();
            }

            // If there are no more buttons than the
            // default left, hide one divider
            if (constants.buttons.length == 1) {
                to_hide_divider.style.visibility = "hidden";
            }

            // Destroy the current impl and select the default one
            variables.current_selected_impl.destroy();
            variables.current_selected_impl = default_button;
            default_button.setOpened();
            variables.drawer.list.selectedIndex = 0;
        }
    });

    /**
     * Check if the current implementations contain a function name
     * 
     * @param name the function name to search
     */
    function buttonsContainName(name: string): boolean {
        for (let i = 0; i < constants.buttons.length; i++) {
            if (constants.buttons[i].name == name) {
                return true;
            }
        }

        return false;
    }

    // Add a close listener to the select name dialog
    constants.select_name_dialog.listen('MDCDialog:closed', (e: any) => {
        // If the close action is 'save', actually save the function
        if (e.detail.action == "save") {
            // Check if the text field is empty.
            // If it is, set the field to valid
            // and re-open the select name dialog
            if (constants.impl_text_field.value.length == 0) {
                constants.impl_text_field.valid = false;
                constants.select_name_dialog.open();
                utils.showMessageSnackbar(`Could not save a function with the name '${constants.impl_text_field.value}'`,
                    "The function name was empty");
                return;
            }

            // Check name length
            if (constants.impl_text_field.value.length > 20) {
                constants.impl_text_field.valid = false;
                constants.select_name_dialog.open();
                utils.showMessageSnackbar(`Could not save the function`,
                    "The function name is too long. Function names may only be up to 20 characters long.");
                return;
            }

            // Only allow names that are not already in use
            if (buttonsContainName(constants.impl_text_field.value)) {
                constants.impl_text_field.valid = false;
                constants.select_name_dialog.open();
                utils.showMessageSnackbar(`Could not save a function with the name '${constants.impl_text_field.value}'`,
                    `A function with the name '${constants.impl_text_field.value}' already exists`);
                return;
            }

            // Check name characters
            const name_regex = /^([a-zA-Z]*[0-9]*_{0,1})*$/g;
            if (!name_regex.test(constants.impl_text_field.value)) {
                constants.impl_text_field.valid = false;
                constants.select_name_dialog.open();
                utils.showMessageSnackbar(`Could not save a function with the name '${constants.impl_text_field.value}'`,
                    `The function name '${constants.impl_text_field.value}' is invalid. Function names may only contain ` +
                    "characters (a-z), numbers(0-9) and underscores in any combination.");
                return;
            }

            // Create a new sidebarButton with the editor value
            // as function string and the name text field value as name.
            // Check the function if it is valid, push it to the buttons
            // array, empty the editor and show the second divider
            let b = new sidebarButton(sidebar_buttons, constants.editor.getValue(), constants.impl_text_field.value);
            b.checkFn();
            constants.buttons.push(b);
            constants.editor.setValue("");
            to_hide_divider.style.visibility = "visible";
            utils.saveAllFunctions();
        }

        // Empty the impl name text field
        constants.impl_text_field.value = "";
    });
}
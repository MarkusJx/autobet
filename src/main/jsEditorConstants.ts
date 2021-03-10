import { MDCDialog } from "@material/dialog";
import { MDCTextField } from "@material/textfield";
import { MDCSnackbar } from "@material/snackbar";
import { editor } from "./ace_wrapper";

import { sidebarButton } from "./sidebarButton";

// Get all required elements

// The 'run tests' button
export const check_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('check-impl-button');
// The 'set as default' button
export const set_default_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("set-default-button");
// The save button
export const save_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("save-impl-button");
// The delete button
export const delete_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("delete-impl-button");
// The 'select name' dialog
export const select_name_dialog: MDCDialog = new MDCDialog(document.getElementById('select-name-dialog'));
// The impl name text field
export const impl_text_field: MDCTextField = new MDCTextField(document.getElementById('impl-name-text-field'));
// The editor message snackbar
export const message_snackbar: MDCSnackbar = new MDCSnackbar(document.getElementById('editor-message-snackbar'));
// The message snackbar label
export const message_snackbar_label: HTMLElement = document.getElementById('editor-message-label');
// The error/message dialog
export const error_dialog: MDCDialog = new MDCDialog(document.getElementById('editor-error-dialog'));
// The error/message dialog text
export const error_dialog_text: HTMLElement = document.getElementById('editor-error-dialog-content');

// The editor title
export const editor_title = document.getElementById("editor-title");
// The 'add implementation' button
export const add_button = document.getElementById("add-impl-button");

// The sidebar buttons array
export const buttons: sidebarButton[] = [];

// Export the editor from ace_wrapper
export { editor };
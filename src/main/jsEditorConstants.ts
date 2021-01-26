import { MDCDialog } from "@material/dialog";
import { MDCTextField } from "@material/textfield";
import { MDCSnackbar } from "@material/snackbar";
import { editor } from "./ace_wrapper";

import { sidebarButton } from "./sidebarButton";

// Get all required elements
export const check_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('check-impl-button'); // The 'run tests' button
export const set_default_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("set-default-button"); // The 'set as default' button
export const save_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("save-impl-button"); // The save button
export const delete_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("delete-impl-button"); // The delete button
export const select_name_dialog: MDCDialog = new MDCDialog(document.getElementById('select-name-dialog')); // The 'select name' dialog
export const impl_text_field: MDCTextField = new MDCTextField(document.getElementById('impl-name-text-field')); // The impl name text field
export const message_snackbar: MDCSnackbar = new MDCSnackbar(document.getElementById('editor-message-snackbar')); // The editor message snachbar
export const message_snackbar_label: HTMLElement = document.getElementById('editor-message-label'); // The message snackbar label
export const error_dialog: MDCDialog = new MDCDialog(document.getElementById('editor-error-dialog')); // The error/message dialog
export const error_dialog_text: HTMLElement = document.getElementById('editor-error-dialog-content'); // The errror/message dialog text

export const editor_title = document.getElementById("editor-title"); // The editor title
export const add_button = document.getElementById("add-impl-button"); // The 'add implementation' button

export const buttons: sidebarButton[] = [];

export { editor };
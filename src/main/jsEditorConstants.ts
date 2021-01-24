'use strict';

import { MDCDialog } from "@material/dialog";
import { MDCTextField } from "@material/textfield";
import { MDCSnackbar } from "@material/snackbar";
import ace from "ace-builds";
import path from "path";

import { sidebarButton } from "./sidebarButton";

// Get all required elements
const check_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('check-impl-button'); // The 'run tests' button
const set_default_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("set-default-button"); // The 'set as default' button
const save_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("save-impl-button"); // The save button
const delete_impl_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById("delete-impl-button"); // The delete button
const select_name_dialog: MDCDialog = new MDCDialog(document.getElementById('select-name-dialog')); // The 'select name' dialog
const impl_text_field: MDCTextField = new MDCTextField(document.getElementById('impl-name-text-field')); // The impl name text field
const message_snackbar: MDCSnackbar = new MDCSnackbar(document.getElementById('editor-message-snackbar')); // The editor message snachbar
const message_snackbar_label = document.getElementById('editor-message-label'); // The message snackbar label
const error_dialog: MDCDialog = new MDCDialog(document.getElementById('editor-error-dialog')); // The error/message dialog
const error_dialog_text = document.getElementById('editor-error-dialog-content'); // The errror/message dialog text

const editor_title = document.getElementById("editor-title"); // The editor title
const add_button = document.getElementById("add-impl-button"); // The 'add implementation' button

ace.config.set('basePath', path.join(__dirname, '..', '..'));
ace.require("ace/ext/language_tools");
const editor: any = ace.edit("editor");

const buttons: sidebarButton[] = [];

export {
    check_impl_button, set_default_button, save_impl_button, delete_impl_button, select_name_dialog,
    impl_text_field, message_snackbar, message_snackbar_label, error_dialog, error_dialog_text,
    editor_title, add_button, editor, buttons
};
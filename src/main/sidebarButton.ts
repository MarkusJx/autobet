import { MDCDrawer } from "@material/drawer";

import { functionStore } from "./functionStore";
import { variables } from "./variables";
import * as autobetLib from "@autobet/autobetlib";
import * as isolatedFunctions from "./isolatedFunctions";
import * as constants from "./jsEditorConstants";
import * as utils from "./jsEditorUtils";

/**
 * A class for storing custom implementations and represententing them
 */
export class sidebarButton {
    element: HTMLElement;
    graphic: HTMLElement;

    /**
     * Whether this is the default (native) implementation
     */
    isDefault: boolean;

    /**
     * The name of this function
     */
    name: string;

    /**
     * Whether this is the active custom betting function
     */
    default: boolean;

    /**
     * Whether this has passed the test
     */
    ok: boolean;

    /**
     * Whether this is currently waiting for the tests to finish
     */
    waiting: boolean;

    /**
     * The function js script string
     */
    fnString: string;

    /**
     * The functionStore instance
     */
    fn: functionStore;

    /**
     * Create a sidebar button. If isDefault is false, the button will be generated
     * 
     * @param element this element, when isDefault == true, or the parent to generate this into
     * @param functionString the function js script string
     * @param name the function name
     * @param functionStore the function store, or null, if this should be generated
     * @param isDefault whether this is the default (native) implementations
     */
    constructor(element: HTMLElement, functionString: string, name: string, functionStore: functionStore = null, isDefault: boolean = false) {
        if (isDefault) {
            this.element = element;
            this.graphic = <HTMLElement>element.getElementsByClassName("material-icons")[0];
        } else {
            // Create the elements
            let el = document.createElement('a');
            el.className = "mdc-list-item";
            let ripple = document.createElement('span');
            ripple.className = "mdc-list-item__ripple";
            let graphic = document.createElement('i');
            graphic.className = "material-icons mdc-list-item__graphic editor-icon-err";
            graphic.innerText = "error_outline";
            let text = document.createElement('span');
            text.className = "mdc-list-item__text";
            text.innerText = name;

            // Append the elements
            element.appendChild(el);
            el.appendChild(ripple);
            el.appendChild(graphic);
            el.appendChild(text);

            this.element = el;
            this.graphic = graphic;

            // Re-generate the drawer
            variables.drawer = new MDCDrawer(document.getElementById('editor-menu-drawer'));
        }

        this.element.addEventListener('click', () => {
            this.setOpened();
        });

        this.isDefault = isDefault;
        this.name = name;
        this.default = false;
        this.ok = false;
        this.waiting = false;
        this.fnString = functionString;


        if (!isDefault) {
            // If functionStore == null, generate it
            if (functionStore == null) {
                this.fn = isolatedFunctions.addFunction(name, functionString);
            } else {
                this.fn = functionStore;
            }
        } else {
            this.fn = null;
        }
    }

    /**
     * Set this to opened
     */
    setOpened(): void {
        // Set current_selected_impl
        variables.current_selected_impl = this;
        constants.editor.setValue(this.fnString, -1);
        variables.drawer.open = false;

        // If this is the default implementation,
        // the title is 'View default', the save
        // and the delete buttons are disabled.
        // Additionally, the editor is disabled
        if (this.isDefault) {
            constants.editor_title.innerText = `View ${this.name}`;
            constants.save_impl_button.disabled = true;
            constants.delete_impl_button.disabled = true;
            utils.setEditorDisabled(true);
        } else {
            constants.editor_title.innerText = `Edit ${this.name}`;
            // Disable the delete and save buttons when
            // waiting for the function to be checked
            constants.delete_impl_button.disabled = this.waiting;
            constants.save_impl_button.disabled = this.ok;
            utils.setEditorDisabled(false);
        }

        constants.check_impl_button.disabled = this.waiting;

        // The set default button is disabled,
        // when this is already the default or this is not ok
        constants.set_default_button.disabled = this.default || !this.ok;
    }

    /**
     * Set whether this is ok
     * 
     * @param val whether this is ok
     */
    setOk(val: boolean): void {
        // Set this.ok and this.fn.ok
        this.ok = val;
        if (!this.isDefault) this.fn.ok = val;

        // If val is true, set the ok icon and set it to green.
        // If val is false, set the error icon and set it to red
        if (val) {
            this.graphic.className = "material-icons mdc-list-item__graphic editor-icon-ok";

            // If this is default, set the default ok icon, otherwise set the ok icon
            if (this.default) {
                this.graphic.innerText = "check_circle_outline";
            } else {
                this.graphic.innerText = "done";
            }
        } else {
            this.graphic.className = "material-icons mdc-list-item__graphic editor-icon-err";
            this.graphic.innerText = "error_outline";
        }
    }

    /**
     * Set whether this is the active custom betting function.
     * Will throw an exception if this is not ok
     * 
     * @param val whether this should be the default implementation
     */
    setDefault(val: boolean): void {
        // Throw an exception if this.ok is false and val is true
        if (val && !this.ok) throw new Error("The element is not ok");
        this.default = val;
        this.graphic.className = "material-icons mdc-list-item__graphic editor-icon-ok";

        // If this should be the default implementation,
        // set the appropriate icon and current_default_button to this
        if (val) {
            this.graphic.innerText = "check_circle_outline";
            // If the current default is not this, tell them
            if (variables.current_default_button != this)
                variables.current_default_button.setDefault(false);

            variables.current_default_button = this;
            utils.showMessageSnackbar(`'${this.name}' is now the default implementation`);
        } else {
            // If ok, set the ok icon, if not ok, set the error icon
            if (this.ok) {
                this.graphic.innerText = "done";
            } else {
                this.graphic.className = "material-icons mdc-list-item__graphic editor-icon-err";
                this.graphic.innerText = "error_outline";
            }
        }

        // If this is the default implementation, revert isolatedFunction to it.
        // If this is not the default implementation, set this as the active function
        if (this.isDefault) {
            isolatedFunctions.revertToDefaultImpl();
        } else {
            try {
                isolatedFunctions.setActiveFunction(this.fn);
                this.fn.active = true;
            } catch (e) {
                autobetLib.logging.error("jsEditor.js", `Could not set the active function: ${e.message}`);
                isolatedFunctions.revertToDefaultImpl();
            }
        }
    }

    /**
     * Check this function for errors
     */
    checkFn(): void {
        // Set this to waiting
        this.waiting = true;
        this.graphic.innerText = "watch_later";
        this.graphic.className = "material-icons mdc-list-item__graphic editor-icon-wait";
        constants.check_impl_button.disabled = true;

        // If the current selected implementation is this, disable saving and deleting
        if (variables.current_selected_impl == this) {
            constants.save_impl_button.disabled = true;
            constants.delete_impl_button.disabled = true;
        }

        // Wait for the check to finish (NOTE: This should be in a promise)
        autobetLib.logging.warn("jsEditor.js", "TODO: This should return a promise");
        let res = isolatedFunctions.checkFunction(this.fnString, this.fn == null ? "default" : this.fn.id);
        // Set whether this is ok and set waiting to false
        this.setOk(res.ok);
        this.waiting = false;
        utils.saveAllFunctions();

        if (res.ok) {
            utils.showMessageSnackbar(`The test of function '${this.name}' was ok`, '<pre style="width: 65vw;">Test results:<br>' +
                utils.syntaxHighlight(JSON.stringify(res.res, null, 6)) + "</pre>");
        } else {
            // Use ts-ignore to ignore all errors as there are none
            // @ts-ignore
            utils.showMessageSnackbar(`The test of function '${this.name}' returned an error`, "Error: " + res.res.error +
                // @ts-ignore
                "<br>Stack:<br>" + res.res.stack.replaceAll("\n", "<br>") + "<br><pre style='width: 65vw;'>Data:<br>" +
                // @ts-ignore
                utils.syntaxHighlight(JSON.stringify(res.res.data, null, 6)) + "</pre>");
        }

        // If the current selected implementation is this, enable saving and deleting
        if (variables.current_selected_impl == this) {
            constants.check_impl_button.disabled = false;
            if (!this.isDefault) {
                constants.delete_impl_button.disabled = false;
                constants.set_default_button.disabled = !res.ok;
                constants.save_impl_button.disabled = res.ok;
            }
        }
    }

    /**
     * Destroy this
     */
    destroy(): void {
        isolatedFunctions.deleteFunction(this.fn);
        this.element.parentNode.removeChild(this.element);
        utils.showMessageSnackbar(`Implementation ${this.name} deleted`, `Implementation ${this.name} successfully deleted`)
    }

    /**
     * Set the function string
     * 
     * @param str the new function string
     */
    setFunctionString(str: string): void {
        this.fnString = str;
        this.fn.functionString = str;
    }

    /**
     * Get the function string
     * 
     * @returns the function string
     */
    getFunctionString(): string {
        return this.fnString;
    }
}
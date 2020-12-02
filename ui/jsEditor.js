const open_editor = document.getElementById('open-editor');
const editor_container = document.getElementById('editor-container');
//const mainContentEl = document.getElementById('editor-main-content');
let drawer = new mdc.drawer.MDCDrawer(document.getElementById('editor-menu-drawer'));
const sidebar_buttons = document.getElementById('editor-sidebar-buttons');
const to_hide_divider = document.getElementById("to-hide-divider");

// Attach a ripple to the open editor button
mdc.ripple.MDCRipple.attachTo(open_editor);

// Add the click event listener for the open_editor button
open_editor.addEventListener('click', () => {
    // If the editor container is already opened, close it, open it otherwise
    if (editor_container.classList.contains("opened")) {
        editor_container.classList.remove("opened");
        open_editor.innerText = "OPEN EDITOR";
    } else {
        editor_container.classList.add("opened");
        open_editor.innerText = "CLOSE EDITOR";
    }
});

// Set topAppBar options
const topAppBar = new mdc.topAppBar.MDCTopAppBar(document.getElementById('editor-top-bar'));
topAppBar.setScrollTarget(document.getElementById('editor-top-bar'));
topAppBar.listen('MDCTopAppBar:nav', () => {
    drawer.open = !drawer.open;
});

// Set ace options
ace.require("ace/ext/language_tools");
const editor = ace.edit("editor");
editor.session.setMode("ace/mode/javascript");
//editor.setTheme("ace/theme/TextMate");
// enable autocompletion and snippets
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: false
});

// Get all required elements
const set_default_button = document.getElementById("set-default-button");
const save_impl_button = document.getElementById("save-impl-button");
const delete_impl_button = document.getElementById("delete-impl-button");
const select_name_dialog = new mdc.dialog.MDCDialog(document.getElementById("select-name-dialog"));
const impl_text_field = new mdc.textField.MDCTextField(document.getElementById("impl-name-text-field"));

const editor_title = document.getElementById("editor-title");
const add_button = document.getElementById("add-impl-button");

/**
 * The current active betting function implementation
 * @type {sidebarButton}
 */
let current_default_button = null;

/**
 * The current displayed implementation in the editor
 * @type {sidebarButton}
 */
let current_selected_impl = null;

/**
 * The default function example string
 */
const default_fn = `// A js implementation of the native implementation may look like this:

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

/**
 * Set the editor disabled
 * 
 * @param {boolean} val if set to true, the editor will be disabled
 */
function setEditorDisabled(val) {
    editor.setReadOnly(val);
    editor.textInput.getElement().disabled = val;
}

class sidebarButton {
    /**
     * Create a sidebar button. If isDefault is false, the button will be generated
     * 
     * @param {HTMLElement} element this element, when isDefault == true, or the parent to generate this into
     * @param {string} functionString the function js script string
     * @param {string} name the function name
     * @param {functionStore} functionStore the function store, or null, if this should be generated
     * @param {boolean} isDefault whether this is the default (native) implementations
     */
    constructor(element, functionString, name, functionStore = null, isDefault = false) {
        if (isDefault) {
            this.element = element;
            this.graphic = element.getElementsByClassName("material-icons")[0];
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
            drawer = new mdc.drawer.MDCDrawer(document.getElementById('editor-menu-drawer'));
        }

        this.element.addEventListener('click', () => {
            this.setOpened();
        });

        /**
         * Whether this is the default (native) implementation
         */
        this.isDefault = isDefault;

        /**
         * The name of this function
         */
        this.name = name;

        /**
         * Whether this is the active custom betting function
         */
        this.default = false;

        /**
         * Whether this has passed the test
         */
        this.ok = false;

        /**
         * Whether this is currently waiting for the tests to finish
         */
        this.waiting = false;

        /**
         * The function js script string
         */
        this.fnString = functionString;


        // If functionStore == null, generate it
        if (functionStore == null)
            /**
             * The functionStore instance
             */
            this.fn = isolatedFunction.addFunction(name, functionString);
        else
            this.fn = functionStore;
    }

    /**
     * Set this to opened
     */
    setOpened() {
        // Set current_selected_impl
        current_selected_impl = this;
        editor.setValue(this.fnString, -1);
        drawer.open = false;

        // If this is the default implementation,
        // the title is 'View default', the save
        // and the delete buttons are disabled.
        // Additionally, the editor is disabled
        if (this.isDefault) {
            editor_title.innerText = `View ${this.name}`;
            save_impl_button.disabled = true;
            delete_impl_button.disabled = true;
            setEditorDisabled(true);
        } else {
            editor_title.innerText = `Edit ${this.name}`;
            // Disable the delete and save buttons when
            // waiting for the function to be checked
            delete_impl_button.disabled = this.waiting;
            save_impl_button.disabled = this.waiting;
            setEditorDisabled(false);
        }

        // The set default button is disabled,
        // when this is already the default or this is not ok
        set_default_button.disabled = this.default || !this.ok;
    }

    /**
     * Set whether this is ok
     * 
     * @param {boolean} val whether this is ok
     */
    setOk(val) {
        // Set this.ok and this.fn.ok
        this.ok = val;
        this.fn.setOk(val);

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
     * @param {boolean} val whether this should be the default implementation
     */
    setDefault(val) {
        // Throw an exception if this.ok is false and val is true
        if (val && !this.ok) throw new Error("The element is not ok");
        this.default = val;
        this.graphic.className = "material-icons mdc-list-item__graphic editor-icon-ok";

        // If this should be the default implementation,
        // set the appropriate icon and current_default_button to this
        if (val) {
            this.graphic.innerText = "check_circle_outline";
            // If the current default is not this, tell them
            if (current_default_button != this)
                current_default_button.setDefault(false);
            current_default_button = this;
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
            isolatedFunction.revertToDefaultImpl();
        } else {
            isolatedFunction.setActiveFunction(this.fn);
        }
    }

    /**
     * Check this function for errors
     */
    checkFn() {
        // Set this to waiting
        this.waiting = true;
        this.graphic.innerText = "watch_later";
        this.graphic.className = "material-icons mdc-list-item__graphic editor-icon-wait";

        // If the current selected implementation is this, disable saving and deleting
        if (current_selected_impl == this) {
            save_impl_button.disabled = true;
            delete_impl_button.disabled = true;
        }

        // Wait for the check to finish
        isolatedFunction.checkFunction(this.fnString).then((res) => {
            // Set whether this is ok and set waiting to false
            this.setOk(res.ok);
            this.waiting = false;

            // IF the current selected implementation is this, enable saving and deleting
            if (current_selected_impl == this) {
                save_impl_button.disabled = false;
                delete_impl_button.disabled = false;
            }
        });
    }

    /**
     * Destroy this
     */
    destroy() {
        isolatedFunction.deleteFunction(this.fn);
        this.element.parentNode.removeChild(this.element);
    }

    /**
     * Set the function string
     * 
     * @param {string} str the new function string
     */
    setFunctionString(str) {
        this.fnString = str;
        this.fn.setFunctionString(str);
    }

    /**
     * Get the function string
     * 
     * @returns {string} the function string
     */
    getFunctionString() {
        return this.fnString;
    }
};

// Set the default button
const default_button = new sidebarButton(document.getElementById("default-impl-button"), default_fn, "default", null, true);
const buttons = [default_button];

// Set current_default_button and current_selected_impl to the default button
current_default_button = default_button;
current_selected_impl = default_button;

// Set the default as default
default_button.setOpened();
default_button.setOk(true);
default_button.setDefault(true);
to_hide_divider.style.visibility = "hidden";

{
    // Iterate over the stored functions and add them to the ui
    let functions = isolatedFunction.getFunctions();
    for (let i = 0; i < functions.length; i++) {
        // Create a new sidebarButton
        let fn = new sidebarButton(sidebar_buttons, functions[i].getFunctionString(), functions[i].getFunctionName(), functions[i]);
        fn.setOk(functions[i].isOk());
        buttons.push(fn);

        // If functions[i] is active, set fn as default
        if (functions[i].isActive()) {
            fn.setDefault(true);
        }
    }
}

// Add the click listener to the add button
add_button.addEventListener('click', () => {
    // Close the drawer and set the title
    drawer.open = false;
    editor_title.innerText = "Add implementation";

    // Empty the editor
    editor.setValue("", -1);

    // Enable the delete and save button, disable the set default button.
    // The current selected implementation is set to null, enable the editor
    save_impl_button.disabled = false;
    delete_impl_button.disabled = false;
    set_default_button.disabled = true;
    current_selected_impl = null;
    setEditorDisabled(false);
});

save_impl_button.addEventListener('click', () => {
    if (current_selected_impl == null) {
        // If current_selected_impl is null, open the name select dialog
        select_name_dialog.open();
    } else {
        // Revert to default impl if to save == current
        if (current_selected_impl.default) {
            default_button.setDefault(true);
            isolatedFunction.revertToDefaultImpl();
        }

        // Set the function string and check it for errors
        current_selected_impl.setFunctionString(editor.getValue());
        current_selected_impl.checkFn();
    }
});

// Add the click listener to the set default button
set_default_button.addEventListener('click', () => {
    // Set the current selected imp as default
    // and disable the set default button
    current_selected_impl.setDefault(true);
    set_default_button.disabled = true;
});

// Add a click listener to the delete button
delete_impl_button.addEventListener('click', () => {
    // If we are currently adding a new implementation, empty the editor
    if (current_selected_impl == null) {
        editor.setValue("", -1);
    } else {
        // Remove the current impl from the buttons array
        let index = buttons.indexOf(current_selected_impl);
        buttons.splice(index, 1);

        // If the current impl is the default,
        // set the native implementation as default
        if (current_selected_impl.default) {
            default_button.setDefault(true);
            isolatedFunction.revertToDefaultImpl();
        }

        // If there are no more buttons than the
        // default left, hide one divider
        if (buttons.length == 1) {
            to_hide_divider.style.visibility = "hidden";
        }

        // Destroy the current impl and select the default one
        current_selected_impl.destroy();
        current_selected_impl = default_button;
        default_button.setOpened();
        drawer.list.selectedIndex = 0;
    }
});

// Add a close listener to the select name dialog
select_name_dialog.listen('MDCDialog:closed', (e) => {
    // If the close action is 'save', actually save the function
    if (e.detail.action == "save") {
        // Check if the text field is empty.
        // If it is, set the field to valid
        // and re-open the select name dialog
        if (impl_text_field.value.length == 0) {
            impl_text_field.valid = false;
            select_name_dialog.open();
            return;
        }

        // Create a new sidebarButton with the editor value
        // as function string and the name text field value as name.
        // Check the function if it is valid, push it to the buttons
        // array, empty the editor and show the second divider
        let b = new sidebarButton(sidebar_buttons, editor.getValue(), impl_text_field.value);
        b.checkFn();
        buttons.push(b);
        editor.setValue("");
        to_hide_divider.style.visibility = "visible";
    }

    // Empty the impl name text field
    impl_text_field.value = "";
});

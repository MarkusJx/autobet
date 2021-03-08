import autobetLib from "@autobet/autobetlib";
import {MDCRipple} from "@material/ripple";
import {MDCMenu} from "@material/menu";
import {showSnackbar, addDescriptionTo} from "./utils";

// The program menu
export const menu: MDCMenu = new MDCMenu(document.getElementById("game-selector"));
// The button to open the menu
export const open_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('game-selector-open-menu-button');
const open_button_label: HTMLElement = document.getElementById('game-selector-open-menu-button-label');

// The container where to generate the menu items into
const menu_items_container: HTMLElement = document.getElementById('game-selector-menu-items-container');

MDCRipple.attachTo(open_button);

// All programs added to the menu
const programs: Program[] = [];
// The currently selected game program
let currentSelected: Program = null;

/**
 * A program running on the target machine
 */
class Program {
    // The menu HTML element
    readonly element: HTMLLIElement;
    // The name of the open window
    readonly windowName: string;
    // The name of the program
    readonly programName: string;
    // The checkmark icon element
    readonly icon: HTMLElement;

    /**
     * Create a Program instance
     *
     * @param windowName the name of the window created by the program
     * @param programName the executable name
     */
    constructor(windowName: string, programName: string) {
        this.windowName = windowName;
        this.programName = programName;

        // Create the parent element
        this.element = document.createElement('li');
        this.element.className = "mdc-list-item";
        this.element.setAttribute("role", "menuitem");

        // Create the mdc ripple
        let ripple = document.createElement('span');
        ripple.className = "mdc-list-item__ripple";

        // Create the menu item text element
        let text = document.createElement('span');
        text.className = "mdc-list-item__text";
        text.innerText = `${programName} - ${windowName}`;

        // Create the checkmark icon element
        this.icon = document.createElement('i');
        this.icon.className = "material-icons mdc-button__icon navigation-strategy-menu-item";
        this.icon.setAttribute("aria-hidden", "true");
        this.icon.innerText = "check";

        // Append all children
        this.element.appendChild(ripple);
        this.element.appendChild(text);
        this.element.appendChild(this.icon);
        menu_items_container.appendChild(this.element);

        // Add a menu item click listener
        this.element.addEventListener('click', () => {
            // Set the game window name
            autobetLib.windows.setGameWindowName(this.programName, this.windowName);
            for (let i = 0; i < programs.length; i++) {
                programs[i].setCheckVisibility(false);
            }

            // Make the checkmark visible
            this.setCheckVisibility(true);

            // Limit the button label length to 17 chars
            let new_label: string = this.programName;
            if (new_label.length >= 18) {
                new_label = new_label.slice(0, 17);
            }

            // Set the button label
            open_button_label.innerText = new_label;
            currentSelected = this;

            // Open a snackbar to display the change
            showSnackbar(`Game application set to '${programName} - ${windowName}'`);
        });
    }

    /**
     * Set the visibility of the checkmark behind the window name
     *
     * @param visible whether the checkmark should be visible
     */
    setCheckVisibility(visible: boolean): void {
        if (visible) {
            this.icon.style.visibility = "visible";
        } else {
            this.icon.style.visibility = "hidden";
        }
    }
}

export function getCurrentlySelectedGameWindow(): void {
    const windowName = autobetLib.windows.getGameWindowName();

    // Limit the button label length to 17 chars
    let new_label: string = windowName.programName;
    if (new_label.length >= 18) {
        new_label = new_label.slice(0, 17);
    }

    // Set the button label
    open_button_label.innerText = new_label;

    currentSelected = new Program(windowName.processName, windowName.programName);
}

/**
 * Generate the GTA 5 menu item
 */
function generateDefaultProgram() {
    const program = new Program("Grand Theft Auto V", "GTA5.exe");
    programs.push(program);

    // If the currently selected program is null or already GTA 5, select the newly created menu item
    if (currentSelected == null || program.windowName === currentSelected.windowName &&
        program.programName === currentSelected.programName) {
        currentSelected = program;
        program.setCheckVisibility(true);
    }
}

/**
 * Generate a list of programs that are running
 */
async function generateProgramList(): Promise<void> {
    // Clear the menu
    menu_items_container.innerHTML = "";
    programs.length = 0;

    // Generate the GTA 5 menu item
    generateDefaultProgram();

    // Get all open windows
    const program_list = await autobetLib.windows.getOpenWindows();

    // Get the object keys
    const program_keys: Array<string> = Object.keys(program_list);
    for (let i = 0; i < program_keys.length; i++) {
        // Get all windows opened by a program
        let windows: Array<string> = program_list[program_keys[i]];
        for (let j = 0; j < windows.length; j++) {
            // If GTA 5 is running, skip, it is already in the list
            if (windows[j] === "Grand Theft Auto V" && program_keys[i] === "GTA5.exe") continue;

            // Create the program menu item
            let toAdd: Program = new Program(windows[j], program_keys[i]);
            programs.push(toAdd);

            // If the currently selected is the same as the last created menu item,
            // set the newly created menu item as checked
            if (currentSelected != null && windows[j] === currentSelected.windowName &&
                program_keys[i] === currentSelected.programName) {
                currentSelected = toAdd;
                toAdd.setCheckVisibility(true);
            }
        }
    }
}

// Cheap synchronization
let generating: boolean = false;

// Open the menu on click
open_button.addEventListener('click', async () => {
    if (!generating) {
        generating = true;
        // Generate the menu
        await generateProgramList();
        menu.open = !menu.open;
        generating = false;
    }
});

// Add an info text
addDescriptionTo("game-selector-info", "Select a Game executable", "Select another (running) " +
    "game executable other than 'GTA5.exe', if your GTA 5 program is differently named or you are using a game streaming " +
    "software to run the game on your PC. The program you want to select must be running and visible. When selecting " +
    "an executable, there will be a list of programs starting with their executables name and separated by a hyphen, " +
    "there will be the name of the window created by the program.");

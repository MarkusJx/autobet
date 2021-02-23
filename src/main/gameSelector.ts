import autobetLib from "@autobet/autobetlib";
import {MDCRipple} from "@material/ripple";
import {MDCMenu} from "@material/menu";

const menu: MDCMenu = new MDCMenu(document.getElementById("game-selector"));
const open_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('game-selector-open-menu-button');
const open_button_label: HTMLElement = document.getElementById('game-selector-open-menu-button-label');

const menu_items_container: HTMLElement = document.getElementById('game-selector-menu-items-container');

MDCRipple.attachTo(open_button);

const programs: Program[] = [];
let currentSelected: Program = null;

class Program {
    readonly element: HTMLLIElement;
    readonly windowName: string;
    readonly programName: string;
    readonly icon: HTMLElement;

    constructor(windowName: string, programName: string) {
        this.windowName = windowName;
        this.programName = programName;

        this.element = document.createElement('li');
        this.element.className = "mdc-list-item";
        this.element.setAttribute("role", "menuitem");

        let ripple = document.createElement('span');
        ripple.className = "mdc-list-item__ripple";

        let text = document.createElement('span');
        text.className = "mdc-list-item__text";
        text.innerText = `${programName} - ${windowName}`;

        this.icon = document.createElement('i');
        this.icon.className = "material-icons mdc-button__icon navigation-strategy-menu-item";
        this.icon.setAttribute("aria-hidden", "true");
        this.icon.innerText = "check";

        this.element.appendChild(ripple);
        this.element.appendChild(text);
        this.element.appendChild(this.icon);
        menu_items_container.appendChild(this.element);

        this.element.addEventListener('click', () => {
            autobetLib.windows.setGameWindowName(this.programName, this.windowName);
            for (let i = 0; i < programs.length; i++) {
                programs[i].setCheckVisibility(false);
            }

            this.setCheckVisibility(true);
            let new_label: string = this.programName;
            if (new_label.length >= 18) {
                new_label = new_label.slice(0, 17);
            }

            open_button_label.innerText = new_label;
            currentSelected = this;
        });
    }

    setCheckVisibility(visible: boolean): void {
        if (visible) {
            this.icon.style.visibility = "visible";
        } else {
            this.icon.style.visibility = "hidden";
        }
    }
}

async function generateProgramList(): Promise<void> {
    menu_items_container.innerHTML = "";
    programs.length = 0;

    const program_list = await autobetLib.windows.getOpenWindows();
    const program_keys: Array<string> = Object.keys(program_list);
    for (let i = 0; i < program_keys.length; i++) {
        let windows: Array<string> = program_list[program_keys[i]];
        for (let j = 0; j < windows.length; j++) {
            let toAdd: Program = new Program(windows[j], program_keys[i]);
            programs.push(toAdd);

            if (currentSelected != null && windows[j] === currentSelected.windowName && program_keys[i] === currentSelected.programName) {
                currentSelected = toAdd;
                toAdd.setCheckVisibility(true);
            }
        }
    }
}

let generating: boolean = false;
open_button.addEventListener('click', async () => {
    if (!generating) {
        generating = true;
        await generateProgramList();
        menu.open = !menu.open;
        generating = false;
    }
});

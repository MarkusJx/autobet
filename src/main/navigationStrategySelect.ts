import autobetLib from "@autobet/autobetlib";
import {MDCMenu} from "@material/menu";
import {MDCRipple} from "@material/ripple";
import {MDCSnackbar} from "@material/snackbar";

const menu: MDCMenu = new MDCMenu(document.getElementById("navigation-strategy-selector"));
const snackbar: MDCSnackbar = new MDCSnackbar(document.getElementById('strategy-select-snackbar'));
const snackbar_label: HTMLDivElement = <HTMLDivElement>document.getElementById('strategy-select-snackbar-label');
snackbar.timeoutMs = 5000;

const open_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('navigation-strategy-selector-open-menu-button');
const open_button_label: HTMLSpanElement = <HTMLSpanElement>document.getElementById('navigation-strategy-selector-open-menu-button-label');

MDCRipple.attachTo(open_button);

class NavigationStrategyMenuItem {
    readonly element: HTMLElement;
    readonly check_icon: HTMLElement;
    readonly strategy: autobetLib.uiNavigation.navigationStrategy;

    constructor(id: string, strategy: autobetLib.uiNavigation.navigationStrategy) {
        this.element = document.getElementById(id);
        this.check_icon = <HTMLElement>this.element.getElementsByClassName('navigation-strategy-menu-item')[0];
        this.strategy = strategy;

        this.element.addEventListener('click', () => this.enableNavigationStrategy());
    }

    setCheckIconVisible(visible: boolean): void {
        if (visible) {
            this.check_icon.style.visibility = "visible";
        } else {
            this.check_icon.style.visibility = "hidden";
        }
    }

    enableNavigationStrategy(show_snackbar: boolean = true): void {
        if (setNavigationStrategy(this.strategy, show_snackbar)) {
            this.setCheckIconVisible(true);
        }
    }
}

const mouse_menu_item = new NavigationStrategyMenuItem('navigation-strategy-mouse',
    autobetLib.uiNavigation.navigationStrategy.MOUSE);
const controller_menu_item = new NavigationStrategyMenuItem('navigation-strategy-controller',
    autobetLib.uiNavigation.navigationStrategy.CONTROLLER);
mouse_menu_item.enableNavigationStrategy(false);

function setNavigationStrategy(strategy: autobetLib.uiNavigation.navigationStrategy, show_snackbar: boolean = true): boolean {
    try {
        autobetLib.uiNavigation.setNavigationStrategy(strategy);
    } catch (e) {
        showSnackbar(`Could not change the input: '${e.message}'`);
        return false;
    }

    mouse_menu_item.setCheckIconVisible(false);
    controller_menu_item.setCheckIconVisible(false);

    switch (strategy) {
        case autobetLib.uiNavigation.navigationStrategy.MOUSE:
            open_button_label.innerText = "MOUSE";
            if (show_snackbar) showSnackbar("Input changed to 'mouse'");
            break;
        case autobetLib.uiNavigation.navigationStrategy.CONTROLLER:
            open_button_label.innerText = "CONTROLLER";
            if (show_snackbar) showSnackbar("Controller connected");
            break;
    }

    return true;
}

function showSnackbar(text: string): void {
    snackbar_label.innerText = text;
    snackbar.open();
}

open_button.addEventListener('click', () => {
    menu.open = !menu.open;
});

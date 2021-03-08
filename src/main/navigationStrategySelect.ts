import autobetLib from "@autobet/autobetlib";
import {MDCMenu} from "@material/menu";
import {MDCRipple} from "@material/ripple";
import {showSnackbar, addDescriptionTo} from "./utils";
import * as clickSleep from"./clickSleep";

// The menu
export const menu: MDCMenu = new MDCMenu(document.getElementById("navigation-strategy-selector"));

// The menu open button
export const open_button: HTMLButtonElement = <HTMLButtonElement>document.getElementById('navigation-strategy-selector-open-menu-button');
const open_button_label: HTMLSpanElement = <HTMLSpanElement>document.getElementById('navigation-strategy-selector-open-menu-button-label');

MDCRipple.attachTo(open_button);

/**
 * A navigation strategy menu item
 */
class NavigationStrategyMenuItem {
    // The menu item HTML element
    readonly element: HTMLElement;
    // The checkmark icon element
    readonly check_icon: HTMLElement;
    // The navigation strategy
    readonly strategy: autobetLib.uiNavigation.navigationStrategy;

    /**
     * Create a navigation strategy menu item
     *
     * @param id the id of the element to append to
     * @param strategy the navigation strategy
     */
    constructor(id: string, strategy: autobetLib.uiNavigation.navigationStrategy) {
        this.element = document.getElementById(id);
        this.check_icon = <HTMLElement>this.element.getElementsByClassName('navigation-strategy-menu-item')[0];
        this.strategy = strategy;

        this.element.addEventListener('click', () => this.enableNavigationStrategy());
    }

    /**
     * Set the checkmark icon visibility
     *
     * @param visible whether the icon should be visible
     */
    setCheckIconVisible(visible: boolean): void {
        if (visible) {
            this.check_icon.style.visibility = "visible";
        } else {
            this.check_icon.style.visibility = "hidden";
        }
    }

    /**
     * Enable this navigation strategy
     *
     * @param show_snackbar whether to show a snackbar confirming the choice
     */
    enableNavigationStrategy(show_snackbar: boolean = true): void {
        if (setNavigationStrategy(this.strategy, show_snackbar)) {
            this.setCheckIconVisible(true);
        }
    }
}

// The mouse strategy menu item
const mouse_menu_item = new NavigationStrategyMenuItem('navigation-strategy-mouse',
    autobetLib.uiNavigation.navigationStrategy.MOUSE);
// The controller strategy menu item
const controller_menu_item = new NavigationStrategyMenuItem('navigation-strategy-controller',
    autobetLib.uiNavigation.navigationStrategy.CONTROLLER);

/**
 * Set the navigation strategy
 *
 * @param strategy the strategy to set
 * @param show_snackbar whether to show a snackbar confirming the choice
 * @return true if the operation was successful
 */
function setNavigationStrategy(strategy: autobetLib.uiNavigation.navigationStrategy, show_snackbar: boolean = true): boolean {
    // Try setting the navigation strategy
    try {
        autobetLib.uiNavigation.setNavigationStrategy(strategy);
    } catch (e) {
        showSnackbar(`Could not change the input: '${e.message}'`);
        return false;
    }

    // Set all checkmark icons invisible
    mouse_menu_item.setCheckIconVisible(false);
    controller_menu_item.setCheckIconVisible(false);

    // Set the strategy in the ui and display the snackbar, if requested
    switch (strategy) {
        case autobetLib.uiNavigation.navigationStrategy.MOUSE:
            open_button_label.innerText = "MOUSE";
            if (show_snackbar) showSnackbar("Input changed to 'mouse'");
            break;
        case autobetLib.uiNavigation.navigationStrategy.CONTROLLER:
            open_button_label.innerText = "CONTROLLER";
            if (show_snackbar) showSnackbar("Controller connected");
            break;
        default:
            return false;
    }

    clickSleep.loadSleepTimes();

    return true;
}

export function loadNavigationStrategy(): void {
    const strategy = autobetLib.uiNavigation.getNavigationStrategy();
    switch (strategy) {
        case autobetLib.uiNavigation.navigationStrategy.CONTROLLER:
            controller_menu_item.enableNavigationStrategy(false);
            break;
        default:
            mouse_menu_item.enableNavigationStrategy(false);
    }
}

// Open the menu on open button click
open_button.addEventListener('click', () => {
    menu.open = !menu.open;
});

// Add a info text
addDescriptionTo("navigation-strategy-info", "Select navigation strategy", "Select a strategy to " +
    "move the cursor in-Game. Currently supported options are 'Mouse' and 'Controller'. When using the 'Mouse' Strategy, " +
    "the program moves your mouse (pointer) in order to click the in-Game UI elements. When using the 'Controller' Strategy, " +
    "the program simulates a Controller using vXbox to click in-Game UI elements. NOTE: In order to use the 'Controller' " +
    "strategy, ScpVBus must be installed and there must be no game controllers connected to your PC. Additionally, " +
    "you may sometimes have to change back to 'Mouse' and then back to 'Controller' if the mouse pointer is not moving.");

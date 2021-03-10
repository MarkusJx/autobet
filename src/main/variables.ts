import {MDCDrawer} from "@material/drawer";
import {MDCRipple} from "@material/ripple";
import {sidebarButton} from "./sidebarButton";

export class variables {
    // The editor menu sidebar
    static drawer: MDCDrawer = new MDCDrawer(document.getElementById('editor-menu-drawer'));

    // The current selected custom implementation
    static current_selected_impl: sidebarButton = null;

    // The current active betting function implementation
    static current_default_button: sidebarButton = null;

    // The current status info
    static statusinfo: HTMLElement = document.getElementById("statusinfo");

    // The time running
    static time: number = 0;

    // Whether GTA is running
    static gta_running: boolean = false;

    // The start/stop betting button
    static startstop: HTMLButtonElement = <HTMLButtonElement>document.getElementById('startstop');
}

MDCRipple.attachTo(variables.startstop);

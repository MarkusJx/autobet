import {app, BrowserWindow, Menu, Tray} from "electron";

type autobetLib_t = typeof import("@autobet/autobetlib");
let tray: Tray | null = null;

export default function createTrayMenu(mainWindow: BrowserWindow, autobetLib: autobetLib_t | null): Tray {
    // Icon src: https://www.iconfinder.com/icons/3827994/business_cash_management_money_icon
    tray = new Tray('resources/icon.png');
    const contextMenu = Menu.buildFromTemplate([
        {label: 'Autobet', type: 'normal', enabled: false},
        {type: 'separator'},
        {label: 'Show UI', type: 'checkbox', checked: true, id: 'show-ui'},
        {type: 'separator'},
        {label: 'Quit', type: 'normal', id: 'quit'}
    ]);
    tray.setToolTip("Autobet");
    tray.setContextMenu(contextMenu);

    const show_ui: Electron.MenuItem = contextMenu.getMenuItemById('show-ui')!;
    show_ui.click = () => {
        if (show_ui.checked) {
            mainWindow.hide();
            show_ui.checked = false;
        } else {
            mainWindow.show();
            show_ui.checked = true;
        }
    };

    const quitItem: Electron.MenuItem = contextMenu.getMenuItemById('quit')!;
    quitItem.click = () => {
        const quit = () => {
            tray!.destroy();
            app.quit();
        };

        quitItem.enabled = false;
        autobetLib?.shutdown()?.then(quit, quit);
    };

    return tray;
}
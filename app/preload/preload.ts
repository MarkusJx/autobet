import {Color, Titlebar} from "custom-electron-titlebar";

document.addEventListener('DOMContentLoaded', () => {
    new Titlebar({
        backgroundColor: Color.fromHex('#151515'),
        icon: "../icon.png",
        menu: null,
        titleHorizontalAlignment: 'left'
    });
});
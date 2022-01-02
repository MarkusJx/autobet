import { TitleBar } from 'electron-react-titlebar/renderer'
import 'electron-react-titlebar/assets/style.css'
import ReactDOM from "react-dom";
import React from 'react';

function renderTitleBar(): Promise<void> {
    return new Promise<void>(resolve => {
        ReactDOM.render(
            <TitleBar/>,
            document.querySelector('.title-bar'),
            resolve
        )
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await renderTitleBar();
    console.log("Preload loaded");
});
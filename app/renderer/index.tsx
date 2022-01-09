import React from "react";
import ReactDOM from "react-dom";
import MainContent from "./components/MainContent";
import "babel-polyfill";
import "../styles/index.scss";
//import { TitleBar } from 'electron-react-titlebar/renderer'
//import 'electron-react-titlebar/assets/style.css'
import "@fontsource/roboto";
import "@fontsource/open-sans";

function renderMainContent(): Promise<void> {
    return new Promise<void>(resolve => {
        ReactDOM.render(
            <React.StrictMode>
                <MainContent/>
            </React.StrictMode>,
            document.getElementById('content-root'),
            resolve
        );
    });
}

/*function renderTitleBar(): Promise<void> {
    return new Promise<void>(resolve => {
        ReactDOM.render(
            <TitleBar/>,
            document.querySelector('title-bar'),
            resolve
        )
    });
}*/

document.addEventListener('DOMContentLoaded', async () => {
    await renderMainContent();
    //await renderTitleBar();
    console.log("Main content rendered");
});
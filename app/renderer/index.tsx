import React from "react";
import ReactDOM from "react-dom";
import MainContent from "./components/MainContent";
import "babel-polyfill";
import "../styles/index.scss";

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

document.addEventListener('DOMContentLoaded', async () => {
    await renderMainContent();
    console.log("Main content rendered");
});
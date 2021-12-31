import React from "react";
import ReactDOM from "react-dom";
import MainContent from "./components/MainContent";

function renderMainContent(): Promise<void> {
    return new Promise<void>(resolve => {
        ReactDOM.render(
            <MainContent/>,
            document.getElementById('content-root'),
            resolve
        );
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderMainContent();
});
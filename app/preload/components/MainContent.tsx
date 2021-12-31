import React from "react";
import BackgroundImage from "./BackgroundImage";

export default class MainContent extends React.Component {
    public override render(): React.ReactNode {
        return (
            <BackgroundImage>
                <h1>TEXT</h1>
            </BackgroundImage>
        );
    }
}
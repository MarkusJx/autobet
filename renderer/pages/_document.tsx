import Document, {Head, Html, Main, NextScript} from 'next/document';
import React from 'react';

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=optional" rel="stylesheet"/>
                    <link href="https://fonts.googleapis.com/css2?family=Fira+Code&display=optional" rel="stylesheet"/>
                    <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=optional" rel="stylesheet"/>
                </Head>
                <body>
                    <Main/>
                    <NextScript/>
                </body>
            </Html>
        )
    }
}
import Document, {DocumentContext, Head, Html, Main, NextScript} from 'next/document'

export default class CustomDocument extends Document {
    public static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx)
        return {...initialProps}
    }

    public override render(): JSX.Element {
        return (
            <Html lang="en">
                <Head/>
                <body>
                    <Main/>
                    <NextScript/>
                </body>
            </Html>
        )
    }
}
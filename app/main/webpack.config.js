const path = require("path");
const nodeExternals = require('webpack-node-externals');

// noinspection WebpackConfigHighlighting
module.exports = {
    target: "electron-main",
    entry: [
        path.resolve(__dirname, "main.ts")
    ],
    output: {
        path: path.resolve(__dirname, '..', '..', "out"),
        filename: "main.bundled.js"
    },
    externalsPresets: {
        node: true
    },
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.(tsx|jsx|ts|js)$/,
                include: [
                    __dirname,
                    path.resolve(__dirname, "..", "shared")
                ],
                exclude: [
                    path.resolve(__dirname, "webpack.config.js")
                ],
                loader: "babel-loader",
                resolve: {
                    extensions: [".ts", ".tsx", ".json", ".js", ".jsx"]
                }
            },
            {
                test: /\.node$/,
                loader: "node-loader",
            }
        ]
    }
}
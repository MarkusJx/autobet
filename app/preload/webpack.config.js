const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const nodeExternals = require('webpack-node-externals');

// noinspection WebpackConfigHighlighting
module.exports = {
    target: "electron-preload",
    entry: [
        path.resolve(__dirname, "index.tsx")
    ],
    output: {
        path: path.resolve(__dirname, '..', '..', "out"),
        filename: "preload.bundled.js"
    },
    externalsPresets: {
        node: true
    },
    externals: [
        nodeExternals()
    ],
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
                test: /\.(css|scss|sass)$/,
                include: [
                    path.resolve(__dirname, '..', "styles"),
                    path.resolve(__dirname, '..', '..', "node_modules"),
                ],
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                            modules: {
                                exportLocalsConvention: 'dashes',
                                localIdentName: '[local]',
                            }
                        }
                    },
                    "sass-loader"
                ],
                resolve: {
                    extensions: [".css", ".scss", ".sass"]
                }
            },
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)$/,
                use: "url-loader"
            },
            {
                test: /\.node$/,
                loader: "node-loader",
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "preload.css"
        })
    ]
};
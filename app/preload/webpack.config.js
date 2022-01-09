const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const nodeExternals = require('webpack-node-externals');

// noinspection WebpackConfigHighlighting
module.exports = {
    target: "electron-preload",
    entry: [
        path.resolve(__dirname, "preload.ts")
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
                    //"style-loader",
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                            modules: {
                                exportLocalsConvention: 'dashes',
                                localIdentName: '[file]-[local]',
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
                test: /\.(eot|woff|woff2|ttf|png|jpg|gif)(\?v=\d+\.\d+\.\d+)?$/,
                use: "asset/resource"
            },
            {
                test: /\.svg$/,
                issuer: /\.(js)x?$/,
                use: ['svgr/webpack']
            },
            {
                test: /\.svg$/,
                issuer: /\.css$/,
                use: ['svg-url-loader']
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
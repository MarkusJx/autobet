const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// noinspection WebpackConfigHighlighting
module.exports = {
    target: "electron-renderer",
    entry: [
        path.resolve(__dirname, 'index.tsx')
    ],
    output: {
        path: path.resolve(__dirname, '..', '..', "out"),
        filename: "renderer.bundled.js"
    },
    module: {
        rules: [
            {
                // loads .html files
                test: /\.(html)$/,
                include: path.resolve(__dirname, "..", "ui"),
                use: {
                    loader: "html-loader",
                    options: {
                        sources: {
                            "list": [{
                                "tag": "img",
                                "attribute": "data-src",
                                "type": "src"
                            }]
                        }
                    }
                }
            },
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
            // loads .css files
            {
                test: /\.(css|scss|sass)$/,
                include: [
                    path.resolve(__dirname, '..', "styles"),
                    path.resolve(__dirname, '..', '..', "node_modules/"),
                ],
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                            modules: {
                                exportLocalsConvention: 'dashes',
                                //localIdentName: '[file]-[local]',
                            }
                        }
                    },
                    "sass-loader"
                ],
                resolve: {
                    extensions: [".css", ".scss", ".sass"]
                }
            },
            // loads common image formats
            {
                test: /\.(eot|woff|woff2|ttf|png|jpg|gif)$/,
                use: "file-loader"
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
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            title: "Autobet",
            template: path.resolve(__dirname, '..', 'web', 'index.hbs')
        })
    ]
}
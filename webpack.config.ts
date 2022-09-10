import path = require('path');
import nodeExternals = require('webpack-node-externals');

module.exports = [
    {
        entry: './electron-src/main/index.ts',
        target: 'electron-main',
        externalsPresets: {
            node: true,
        },
        externals: [nodeExternals()],
        output: {
            path: path.join(__dirname, 'out'),
            filename: 'index.bundled.js',
        },
        node: {
            __dirname: false,
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.node$/,
                    loader: 'node-loader',
                },
            ],
        },
        resolve: {
            extensions: ['.ts'],
        },
        devtool: 'source-map',
    },
    {
        entry: './electron-src/preload/preload.ts',
        target: 'electron-preload',
        externalsPresets: {
            node: true,
        },
        externals: [nodeExternals()],
        output: {
            path: path.join(__dirname, 'out'),
            filename: 'preload.bundled.js',
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.node$/,
                    loader: 'node-loader',
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        devtool: 'source-map',
    },
];

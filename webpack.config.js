const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ExtReloader = require("webpack-ext-reloader");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: {
      index: "./src/index.tsx",
      background: "./background.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        filename: "index.html",
        chunks: ["index"],
      }),
      new CopyPlugin({
        patterns: [
          { from: "manifest.json", to: "manifest.json" },
          { from: "public/icon16.png", to: "icon16.png" },
          { from: "public/icon48.png", to: "icon48.png" },
          { from: "public/icon128.png", to: "icon128.png" },
        ],
      }),
      ...(isProduction
        ? []
        : [
            new ExtReloader({
              port: 8012,
              reloadPage: true,
              entries: {
                extensionPage: "index",
                background: "background",
              },
            }),
          ]),
    ],
    devtool: isProduction ? false : "inline-source-map",
  };
};

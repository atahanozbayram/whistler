const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        exclude: /node_modules/i,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.html$/i,
        exclude: /node_modules/i,
        use: [
          {
            loader: "html-loader",
          },
        ],
      },
      {
        test: /\.css$/i,
        exclude: /node_modules/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "./index.html",
    }),
  ],
};

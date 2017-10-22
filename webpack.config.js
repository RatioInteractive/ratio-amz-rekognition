const webpack = require('webpack')
const slsw = require('serverless-webpack')

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  externals: [
    /aws-sdk/ // Available on AWS Lambda
  ],
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: true,
      mangle: process.env.NODE_ENV === 'production',    // DEMO ONLY: Don't change variable names.
      beautify: process.env.NODE_ENV !== 'production',   // DEMO ONLY: Preserve whitespace
      output: {
        comments: process.env.NODE_ENV !== 'production'  // DEMO ONLY: Helpful comments
      },
      sourceMap: false
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /test/],
        loader: 'babel-loader',
        query: {
          plugins: ['lodash', 'transform-decorators-legacy'],
          presets: [
            [
              'env',
              {
                target: { node: 6.10 }, // Node version on AWS Lambda
                useBuiltIns: true,
                modules: false,
                loose: true
              }
            ]
          ]
        }
      }
    ]
  }
}

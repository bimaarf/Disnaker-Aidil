const WorkboxWebpackPlugin = require("workbox-webpack-plugin");

module.exports = {
  // Other webpack config...
  plugins: [
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: "./src/service-worker.js",
      swDest: "service-worker.js",
      include: [/\.html$/, /\.js$/, /\.css$/, /\.png$/, /\.jpg$/],
    }),
  ],
};

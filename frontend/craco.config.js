const WebpackObfuscator = require("webpack-obfuscator");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.plugins.push(
        new WebpackObfuscator(
          {
            rotateStringArray: true,
            stringArray: true,
            stringArrayEncoding: ["rc4"], 
            compact: true,
            controlFlowFlattening: true, 
          },
          ["**/node_modules/**"] 
        )
      );
      return webpackConfig;
    },
  },
};

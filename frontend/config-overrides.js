const webpack = require('webpack');
const { override, addBabelPreset } = require('customize-cra');

module.exports = override(
  (config) => {
    // Настройка полифилов через ProvidePlugin
    config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ];

    // Добавление полифилов для Node.js модулей
    config.resolve = {
      ...config.resolve,
      fallback: {
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url'),
        assert: require.resolve('assert'),
      },
    };

    // Игнорируем минимизированные файлы
    config.module.rules.push({
      test: /\.min\.js$/,
      use: 'null-loader',
    });

    return config;
  },
  
  // Добавление пресета Babel для поддержки современных синтаксических конструкций
  addBabelPreset('@babel/preset-env')
);

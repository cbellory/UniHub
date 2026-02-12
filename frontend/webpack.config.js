const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Плагин для очистки старых файлов сборки
const TerserPlugin = require('terser-webpack-plugin'); // Минификатор JS
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Плагин для извлечения CSS в отдельные файлы
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin'); // Минификатор CSS

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'; // Проверяем режим сборки

  return {
    entry: './src/index.js', // Точка входа вашего приложения
    output: {
      filename: isProduction ? '[name].[contenthash].js' : 'bundle.js', // Хеширование в продакшене
      path: path.resolve(__dirname, 'dist'), // Папка, куда будут собраны файлы
      publicPath: '/', // Для роутинга
      clean: true, // Очистка выходной папки перед сборкой
    },
    mode: isProduction ? 'production' : 'development', // Устанавливаем режим сборки
    devtool: isProduction ? 'source-map' : 'inline-source-map', // Исходные карты только для продакшн
    devServer: {
      static: './dist',
      hot: true, // Включение горячей перезагрузки
      historyApiFallback: true, // Для поддержки роутинга в single-page приложениях
    },
    module: {
      rules: [
        {
          test: /\.js$/, // Обрабатываем JavaScript файлы
          exclude: /node_modules/, // Исключаем node_modules
          use: {
            loader: 'babel-loader', // Используем Babel для трансформации JS
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'], // Пресеты для ES6+ и React
            },
          },
        },
        {
          test: /\.css$/, // Обрабатываем CSS файлы
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader', // Извлечение CSS в продакшене
            'css-loader',
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i, // Обработка изображений
          type: 'asset/resource',
        },
      ],
    },
    optimization: {
      minimize: isProduction, // Минифицируем только в продакшене
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false, // Удаление комментариев в продакшене
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(), // Минификация CSS
      ],
      splitChunks: {
        chunks: 'all', // Разделение кода для лучшей оптимизации
      },
      runtimeChunk: 'single', // Отделяем runtime-код для лучшего кеширования
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html', // Шаблон для HTML
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              minifyCSS: true,
              minifyJS: true,
              minifyURLs: true,
            }
          : false, // Минификация HTML в продакшене
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css', // Извлечение и хеширование CSS
      }),
      new CleanWebpackPlugin(), // Очистка dist перед новой сборкой
    ],
    resolve: {
      extensions: ['.js', '.jsx'], // Поддерживаемые расширения файлов
    },
  };
};

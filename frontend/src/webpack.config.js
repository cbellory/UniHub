const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Точка входа вашего приложения
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'), // Папка, куда будут собраны файлы
    publicPath: '/'
  },
  mode: 'development', // Устанавливаем режим сборки (development или production)
  devtool: 'source-map', // Генерация исходных карт
  devServer: {
    static: './dist',
    hot: true, // Включение горячей перезагрузки
    historyApiFallback: true, // Для поддержки роутинга в single-page приложениях
    setupMiddlewares: (middlewares, devServer) => {
      // Здесь можно настроить кастомные middleware
      return middlewares;
    },
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
        use: ['style-loader', 'css-loader'], // Подключаем стили
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'], // Загружаем исходные карты
        exclude: [
          /node_modules\/@walletconnect\//, // Исключаем модули WalletConnect для source maps
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Обработка изображений
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Шаблон для HTML
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'], // Поддерживаемые расширения файлов
  },
};

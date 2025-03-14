module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            assets: './assets',
            '@components': './components',
            '@pages': './pages',
            '@models': './models',
            '@utils': './utils',
          },
        },
      ],
    ],
  };
}; 
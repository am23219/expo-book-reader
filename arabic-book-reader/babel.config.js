module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      '@babel/plugin-syntax-dynamic-import',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@ui': './src/components/ui',
            '@layout': './src/components/layout',
            '@features': './src/features',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@types': './src/types',
            '@assets': './src/assets',
            '@pages': './src/pages',
          },
        },
      ],
    ],
  };
}; 
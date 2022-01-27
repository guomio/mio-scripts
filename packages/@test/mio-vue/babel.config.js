module.exports = {
  plugins: [
    [
      require.resolve('babel-plugin-component'),
      {
        libraryName: 'element-plus',
        styleLibraryName: 'theme-chalk',
      },
    ],
  ],
};

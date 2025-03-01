module.exports = function (options) {
  return {
    ...options,
    externals: [
      'canvas',
    ],
    mode: 'development',
  };
};

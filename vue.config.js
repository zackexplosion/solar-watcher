if (process.env.NODE_ENV !== 'production') {
  const app = require('./server/index.js')
}
module.exports = {
  devServer: {
    // before: () => {
    //   // app()
    // },
    proxy: {
      '/api': {
        target: 'http://localhost:7777',
        // target: 'https://google.com',
      },
      '/socket': {
        target: 'http://localhost:7777',
        // target: 'https://google.com',
      },
    },
  },
}

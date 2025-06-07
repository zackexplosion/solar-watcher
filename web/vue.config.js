// if (process.env.NODE_ENV !== 'production') {
//   const app = require('./server/index.js')
//   console.log('app loaded', app)
// }
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

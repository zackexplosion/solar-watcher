module.exports = {
  apps: [
    {
      name: 'solar-watcher',
      script: `${__dirname}/server/index.js`,
      // watch: true,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        SERVER_LOG_PATH: '/var/log/nginx/solar.log',
        SERVER_VALID_ID_LIST: '1234, 5678',
      },
    },
  ],
}

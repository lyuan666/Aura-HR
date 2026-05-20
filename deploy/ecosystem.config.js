module.exports = {
  apps: [
    {
      name: 'yzschros-api',
      script: 'apps/api/dist/main.js',
      cwd: '/opt/yzschros',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001,
        CORS_ORIGINS: 'http://localhost:3000,http://localhost:3002,http://localhost:3003,http://47.97.62.57,http://www.txos.top,https://www.txos.top',
      },
    },
    {
      name: 'yzschros-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/yzschros',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};

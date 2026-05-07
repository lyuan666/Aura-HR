module.exports = {
  apps: [
    {
      name: 'yzschros-api',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/opt/yzschros/apps/api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'yzschros-web',
      script: 'bash',
      args: 'start-web.sh',
      cwd: '/opt/yzschros',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};

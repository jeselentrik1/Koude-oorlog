module.exports = {
  apps: [
    {
      name: 'koude-oorlog',
      script: 'index.js',
      cwd: './server',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 6767
      }
    }
  ]
};

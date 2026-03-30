module.exports = {
  apps: [{
    name: 'kora-backend',
    script: './server.js',
    instances: 'max', // Leverages cluster mode to run on all available CPUs
    exec_mode: 'cluster', // Enables zero-downtime reloads and multi-threading
    autorestart: true,
    watch: false,
    max_memory_restart: '1G', // Restarts a thread if it causes a memory leak
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};

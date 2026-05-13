require('dotenv').config({ path: '/var/www/fatinness/server/.env' });

module.exports = {
  apps: [{
    name: 'fatinness',
    script: '/var/www/fatinness/server/server.js',
    cwd: '/var/www/fatinness/server',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  }]
};

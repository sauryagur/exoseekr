// PM2 Ecosystem Configuration for ExoSeekr
// Manages both FastAPI backend and Next.js frontend

module.exports = {
  apps: [
    {
      name: 'exoseekr-backend',
      cwd: '/app/backend',
      script: 'venv/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000 --reload',
      interpreter: 'none', // Don't use PM2's built-in interpreter
      instances: 1,
      autorestart: true,
      watch: [
        '/app/backend/main.py',
        '/app/backend/*.py'
      ],
      ignore_watch: [
        'node_modules',
        'venv',
        '__pycache__',
        '*.pyc',
        '.git'
      ],
      env: {
        NODE_ENV: 'production',
        PYTHONPATH: '/app/backend',
        PORT: '8000'
      },
      error_file: '/app/logs/backend-error.log',
      out_file: '/app/logs/backend-out.log',
      log_file: '/app/logs/backend-combined.log',
      time: true,
      max_memory_restart: '500M'
    },
    {
      name: 'exoseekr-frontend',
      cwd: '/app/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: [
        '/app/frontend/app',
        '/app/frontend/components',
        '/app/frontend/lib',
        '/app/frontend/styles'
      ],
      ignore_watch: [
        'node_modules',
        '.next',
        'dist',
        '.git'
      ],
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        NEXT_TELEMETRY_DISABLED: '1',
        BACKEND_URL: 'http://localhost:8000'
      },
      error_file: '/app/logs/frontend-error.log',
      out_file: '/app/logs/frontend-out.log',
      log_file: '/app/logs/frontend-combined.log',
      time: true,
      max_memory_restart: '1G'
    }
  ],
  
  // PM2 monitoring and management
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:sauryagur/exoseekr.git',
      path: '/var/www/exoseekr',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
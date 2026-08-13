module.exports = {
  apps: [
    {
      name: "staging Enggang frontend-psb port 8889",
      script: "bash",
      args: "-c 'npx serve -s build -l 8889'",
      cwd: "/var/www/enggangfoundation.id/frontend",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

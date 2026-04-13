module.exports = {
  apps: [{
    name: "telebox",
    script: "npm",
    args: "start",
    cwd: "/app",
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    merge_logs: true,
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s",
    restart_delay: 4000,
    env: { NODE_ENV: "production" }
  }]
}

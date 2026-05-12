module.exports = {
  apps: [
    {
      name: "odl-pdf-service",
      script: "scripts/odl-service/app.py",
      interpreter: "python3",
      cwd: "/Users/lee/Desktop/YZSCHROS",
      env: {
        ODL_PORT: "8900",
        JAVA_HOME: "/opt/homebrew/opt/openjdk",
        PATH: "/opt/homebrew/opt/openjdk/bin:/usr/local/bin:/usr/bin:/bin",
      },
      max_memory_restart: "500M",
      max_restarts: 10,
      restart_delay: 5000,
      error_file: "/tmp/odl-pdf-error.log",
      out_file: "/tmp/odl-pdf-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};

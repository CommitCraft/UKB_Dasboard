module.exports = {
  apps: [
    {
      name: "aplos_logix-frontend",
      cwd: "./",
      script: "npm",
      args: "run dev",
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 8800,
      },
    },
  ],
};

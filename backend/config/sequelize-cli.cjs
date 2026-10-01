const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const config = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "socially",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3307,
  dialect: "mysql",
};

module.exports = {
  development: config,
  test: config,
  production: config,
};

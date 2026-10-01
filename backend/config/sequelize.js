import { Sequelize } from "sequelize";

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3307,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "socially",
  dialect: "mysql",
  charset: "utf8mb4_unicode_ci",
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
};

export { config };

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    charset: config.charset,
    logging: config.logging,
    define: config.define,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default sequelize;
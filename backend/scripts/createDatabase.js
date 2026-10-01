import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { config } from "../config/sequelize.js";

dotenv.config();

const { database, username, password, host, port } = config;

// Connect without a database selected so CREATE DATABASE works
const connection = await mysql.createConnection({ host, port, user: username, password });

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\`
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci`
  );

  console.log(`Database \`${database}\` ready on ${host}:${port}`);
} catch (error) {
  console.error(`Could not create database: ${error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
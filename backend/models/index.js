import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelize.js";
import defineUser from "./user.js";
import defineFbAccount from "./fbAccount.js";
import defineFbScheduledPost from "./fbSchedulePost.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = {
  sequelize,
  Sequelize,
  User: defineUser(sequelize),
  FbAccount: defineFbAccount(sequelize),
  FbScheduledPost: defineFbScheduledPost(sequelize),
};

// Wire up associations
Object.values(db).forEach((model) => {
  if (model && typeof model.associate === "function") {
    model.associate(db);
  }
});

export { fs, path, __dirname };
export default db;
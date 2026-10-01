import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");
const SEEDERS_DIR = path.join(__dirname, "..", "seeders");

// Must come from the instance: `new QueryInterface(sequelize)` leaves
// queryGenerator undefined, which breaks createTable.
const meta = () => sequelize.getQueryInterface();

const ensureMetaTable = async () => {
  const queryInterface = meta();

  await queryInterface.createTable("SequelizeMeta", {
    name: {
      type: Sequelize.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
  });
};

const listFiles = async (dir) => {
  if (!fs.existsSync(dir)) return [];

  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".js"))
    .map((e) => e.name)
    .sort();
};

const appliedNames = async () => {
  const [rows] = await sequelize.query("SELECT name FROM SequelizeMeta");
  return rows.map((r) => r.name);
};

const markApplied = (name) => meta().bulkInsert("SequelizeMeta", [{ name }]);

const run = async (dir, { table }) => {
  await ensureMetaTable();
  await sequelize.authenticate();

  const files = await listFiles(dir);
  const applied = new Set(await appliedNames());

  for (const file of files) {
    if (applied.has(file)) continue;

    const mod = await import(pathToFileURL(path.join(dir, file)).href);

    console.log(`Running ${table} ${file}`);
    await mod.default.up(meta(), Sequelize);

    await markApplied(file);
    console.log(`Done ${table} ${file}`);
  }
};

const revert = async (dir, { table }) => {
  await ensureMetaTable();
  await sequelize.authenticate();

  const files = await listFiles(dir);
  const applied = await appliedNames();

  const last = applied.filter((n) => files.includes(n)).pop();

  if (!last) {
    console.log("Nothing to revert");
    return;
  }

  const mod = await import(pathToFileURL(path.join(dir, last)).href);

  console.log(`Reverting ${table} ${last}`);
  await mod.default.down(meta(), Sequelize);

  await meta().bulkDelete("SequelizeMeta", { name: last });
  console.log(`Reverted ${table} ${last}`);
};

const status = async (dir, { table }) => {
  await ensureMetaTable();
  await sequelize.authenticate();

  const files = await listFiles(dir);
  const applied = new Set(await appliedNames());

  console.log(`\n${table}`);
  for (const file of files) {
    console.log(`  ${applied.has(file) ? "[x]" : "[ ]"} ${file}`);
  }
  console.log("");
};

const command = process.argv[2] || "up";
const isSeeder = command.endsWith(":seed") || command === "seed";

let dir = MIGRATIONS_DIR;
let table = "migration";

if (isSeeder) {
  dir = SEEDERS_DIR;
  table = "seeder";
}

try {
  if (command === "status") await status(dir, { table });
  else if (command === "down" || command === "down:seed") await revert(dir, { table });
  else await run(dir, { table });

  await sequelize.close();
  process.exit(0);
} catch (error) {
  console.error(error.message);
  await sequelize.close();
  process.exit(1);
}
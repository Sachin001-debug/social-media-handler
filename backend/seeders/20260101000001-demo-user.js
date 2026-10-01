import bcrypt from "bcryptjs";

const DEMO_EMAIL = "sachin@example.com";
const DEMO_PASSWORD = "password123";
const DEMO_NAME = "Sachin Kharel";

const seed = async (queryInterface, Sequelize) => {
  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [existing] = await queryInterface.sequelize.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    { replacements: [DEMO_EMAIL] }
  );

  if (existing.length > 0) {
    console.log(`Demo user ${DEMO_EMAIL} already exists, skipping.`);
    return;
  }

  await queryInterface.bulkInsert("users", [
    {
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    },
  ]);

  console.log(`Seeded demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
};

const undo = async (queryInterface) => {
  await queryInterface.bulkDelete("users", { email: DEMO_EMAIL });
};

export { DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME };
export default { up: seed, down: undo };
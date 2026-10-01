import db from "../models/index.js";

export const toPublicUser = (user) => {
  const plain = typeof user.get === "function" ? user.get({ plain: true }) : user;

  return {
    id: plain.id,
    name: plain.name,
    email: plain.email,
  };
};

export const findUserByEmail = async (email) => {
  const user = await db.User.findOne({ where: { email } });

  return user ? user.get({ plain: true }) : null;
};

export const findUserById = async (id) => {
  const user = await db.User.findByPk(id);

  return user ? user.get({ plain: true }) : null;
};

export const createUser = async ({ name, email, passwordHash }) => {
  const user = await db.User.create({ name, email, passwordHash });

  return toPublicUser(user);
};
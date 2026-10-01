import db from "../models/index.js";

// Never return accessToken to the client
export const toPublicFbAccount = (account) => {
  const plain = typeof account.get === "function" ? account.get({ plain: true }) : account;

  return {
    id: plain.id,
    fbUserId: plain.fbUserId,
    name: plain.name,
    email: plain.email,
    picture: plain.picture,
    connectedAt: plain.createdAt,
  };
};

export const listFbAccounts = async (userId) => {
  const accounts = await db.FbAccount.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });

  return accounts.map(toPublicFbAccount);
};

export const findFbAccountByFbUserId = async (fbUserId) => {
  const account = await db.FbAccount.findOne({ where: { fbUserId } });

  return account ? account.get({ plain: true }) : null;
};

// Connect a Facebook account for a user.
// Re-connecting the same account refreshes the stored token instead of duplicating.
export const upsertFbAccount = async ({
  userId,
  fbUserId,
  name,
  email,
  picture,
  accessToken,
}) => {
  const [account] = await db.FbAccount.findOrCreate({
    where: { fbUserId },
    defaults: { userId, fbUserId, name, email, picture, accessToken },
  });

  await account.update({
    userId,
    name,
    email,
    picture,
    accessToken,
  });

  return account;
};

export const deleteFbAccount = async (userId, id) => {
  // Scoped by userId so one user cannot delete another's account
  const destroyed = await db.FbAccount.destroy({ where: { id, userId } });

  return destroyed > 0;
};
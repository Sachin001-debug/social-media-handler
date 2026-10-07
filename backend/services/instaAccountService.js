import db from "../models/index.js";

export const findInstaAccountByIgUserId = async (igUserId) => {
  const account = await db.InstagramAccount.findOne({ where: { igUserId } });

  return account ? account.get({ plain: true }) : null;
};

// Connect an Instagram account for a user.
// Re-connecting the same account refreshes the stored data instead of duplicating.
export const upsertInstaAccount = async ({
  userId,
  igUserId,
  username,
  profilePictureUrl,
  pageId,
  pageName,
  pageAccessToken,
}) => {
  const [account, created] = await db.InstagramAccount.findOrCreate({
    where: { igUserId },
    defaults: {
      userId,
      igUserId,
      username,
      profilePictureUrl,
      pageId,
      pageName,
      pageAccessToken,
    },
  });

  if (!created && Number(account.userId) !== Number(userId)) {
    const error = new Error("This Instagram account is already linked to another user");
    error.status = 409;
    throw error;
  }

  await account.update({
    userId,
    username,
    profilePictureUrl,
    pageId,
    pageName,
    pageAccessToken,
  });

  return account;
};

// Never expose the page access token to the frontend
export const listInstaAccounts = async (userId) => {
  const accounts = await db.InstagramAccount.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    attributes: [
      "id",
      "igUserId",
      "username",
      "profilePictureUrl",
      "pageName",
      "createdAt",
    ],
  });

  return accounts.map((account) => ({
    id: account.id,
    igUserId: account.igUserId,
    username: account.username,
    profilePictureUrl: account.profilePictureUrl,
    pageName: account.pageName,
    connectedAt: account.createdAt,
  }));
};

export const deleteInstaAccount = async (userId, id) => {
  const destroyed = await db.InstagramAccount.destroy({ where: { id, userId } });

  return destroyed > 0;
};

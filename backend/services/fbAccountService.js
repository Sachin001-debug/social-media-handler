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
  let accounts;
  try {
    accounts = await db.FbAccount.findAll({
      where: { userId, isPage: true },
      order: [["createdAt", "DESC"]],
    });
  } catch (cause) {
    const databaseError = cause.original || cause.parent || cause;
    if (
      databaseError.code === "ER_BAD_FIELD_ERROR" &&
      /\bis_page\b/i.test(databaseError.sqlMessage || databaseError.message || "")
    ) {
      const error = new Error(
        "Facebook Page database migration is missing. Run `npm run migrate` in the backend, then reconnect Facebook."
      );
      error.status = 503;
      error.cause = cause;
      throw error;
    }
    throw cause;
  }

  return accounts.map(toPublicFbAccount);
};

export const getFbPagePicture = async (userId, accountId) => {
  const account = await db.FbAccount.findOne({
    where: { id: accountId, userId, isPage: true },
    attributes: ["fbUserId", "accessToken"],
  });

  if (!account) {
    const error = new Error("Facebook Page not found");
    error.status = 404;
    throw error;
  }
  if (!account.accessToken) {
    const error = new Error("Reconnect Facebook to refresh this Page's access");
    error.status = 409;
    throw error;
  }

  const pictureUrl = new URL(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(account.fbUserId)}/picture`
  );
  pictureUrl.searchParams.set("type", "large");
  pictureUrl.searchParams.set("access_token", account.accessToken);

  const response = await fetch(pictureUrl);
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.startsWith("image/")) {
    const error = new Error("Facebook did not return a Page image");
    error.status = 502;
    throw error;
  }

  const image = Buffer.from(await response.arrayBuffer());
  if (image.length === 0 || image.length > 5 * 1024 * 1024) {
    const error = new Error("Facebook returned an invalid Page image");
    error.status = 502;
    throw error;
  }

  return { image, contentType };
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
  email = null,
  picture,
  accessToken,
}) => {
  const [account, created] = await db.FbAccount.findOrCreate({
    where: { fbUserId },
    defaults: { userId, fbUserId, name, email, picture, accessToken, isPage: true },
  });

  if (!created && Number(account.userId) !== Number(userId)) {
    const error = new Error("This Facebook Page is already linked to another user");
    error.status = 409;
    throw error;
  }

  await account.update({
    userId,
    name,
    email,
    picture,
    accessToken,
    isPage: true,
  });

  return account;
};

export const deleteFbAccount = async (userId, id) => {
  // Scoped by userId so one user cannot delete another's account
  const destroyed = await db.FbAccount.destroy({ where: { id, userId } });

  return destroyed > 0;
};
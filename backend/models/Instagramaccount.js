import { DataTypes } from "sequelize";

export default (sequelize) => {
  const InstagramAccount = sequelize.define(
    "InstagramAccount",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "user_id",
      },
      igUserId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: "ig_user_id",
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      profilePictureUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "profile_picture_url",
      },
      // Facebook Page the Instagram account is linked to
      pageId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: "page_id",
      },
      pageName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "page_name",
      },
      // Page access token, used to publish to Instagram
      pageAccessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "page_access_token",
      },
    },
    {
      tableName: "instagram_accounts",
      timestamps: true,
      underscored: true,
      updatedAt: "updated_at",
    }
  );

  InstagramAccount.associate = (models) => {
    InstagramAccount.belongsTo(models.User, {
      foreignKey: { name: "userId", field: "user_id" },
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return InstagramAccount;
};
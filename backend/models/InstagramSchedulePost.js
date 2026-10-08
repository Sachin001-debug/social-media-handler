import { DataTypes } from "sequelize";

export default (sequelize) => {
  const InstagramScheduledPost = sequelize.define(
    "InstagramScheduledPost",
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
      // form: instagramAccountId (the selected connected account)
      instagramAccountId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "instagram_account_id",
      },
      // form: caption (Instagram limit is 2200 chars)
      caption: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
        validate: { len: [0, 2200] },
      },
      // form: link (optional, stored for later use)
      link: {
        type: DataTypes.STRING(2048),
        allowNull: true,
      },
      // form: mediaType (Instagram has no audio publishing)
      mediaType: {
        type: DataTypes.ENUM("none", "image", "video"),
        allowNull: false,
        defaultValue: "none",
        field: "media_type",
      },
      // form: file (store the saved file's info, not the File object)
      mediaPath: {
        type: DataTypes.STRING(512),
        allowNull: true,
        field: "media_path",
      },
      mediaOriginalName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "media_original_name",
      },
      mediaMimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "media_mime_type",
      },
      mediaSize: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        field: "media_size",
      },
      // form: mode ('now' | 'schedule')
      mode: {
        type: DataTypes.ENUM("now", "schedule"),
        allowNull: false,
        defaultValue: "schedule",
      },
      // form: scheduledAt (null when mode = 'now')
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "scheduled_at",
      },
      // publishing lifecycle
      status: {
        type: DataTypes.ENUM("pending", "processing", "published", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      instaPostId: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: "insta_post_id",
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "error_message",
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "published_at",
      },
    },
    {
      tableName: "instagram_scheduled_posts",
      timestamps: true,
      underscored: true,
      updatedAt: "updated_at",
      indexes: [
        // lets the scheduler quickly find due posts
        { fields: ["status", "scheduled_at"] },
        { fields: ["user_id"] },
        { fields: ["instagram_account_id"] },
      ],
    }
  );

  InstagramScheduledPost.associate = (models) => {
    InstagramScheduledPost.belongsTo(models.User, {
      foreignKey: { name: "userId", field: "user_id" },
      as: "user",
      onDelete: "CASCADE",
    });
    InstagramScheduledPost.belongsTo(models.InstagramAccount, {
      foreignKey: { name: "instagramAccountId", field: "instagram_account_id" },
      as: "instagramAccount",
      onDelete: "CASCADE",
    });
  };

  return InstagramScheduledPost;
};

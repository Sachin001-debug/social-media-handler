import { DataTypes } from "sequelize";

export default (sequelize) => {
  const FbAccount = sequelize.define(
    "FbAccount",
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
      fbUserId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: "fb_user_id",
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      picture: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "access_token",
      },
    },
    {
      tableName: "fb_accounts",
      timestamps: true,
      underscored: true,
      updatedAt: "updated_at",
    }
  );

  FbAccount.associate = (models) => {
    FbAccount.belongsTo(models.User, {
      foreignKey: { name: "userId", field: "user_id" },
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return FbAccount;
};
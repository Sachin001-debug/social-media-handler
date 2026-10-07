"use strict";

const migration = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("instagram_accounts", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      ig_user_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      profile_picture_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      page_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      page_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      page_access_token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("instagram_accounts", ["ig_user_id"], {
      name: "uq_instagram_accounts_ig_user",
      unique: true,
    });
    await queryInterface.addIndex("instagram_accounts", ["user_id"], {
      name: "idx_instagram_accounts_user",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("instagram_accounts");
  },
};

export default migration;

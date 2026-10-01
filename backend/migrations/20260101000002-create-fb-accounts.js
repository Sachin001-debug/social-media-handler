"use strict";

/** @type {import('sequelize-cli').Migration} */
const migration = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fb_accounts", {
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
      fb_user_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      picture: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      access_token: {
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

    // One row per connected Facebook account. Unique on fb_user_id alone means a
    // user can connect many accounts, but a given Facebook account belongs to
    // exactly one user.
    await queryInterface.addIndex("fb_accounts", ["fb_user_id"], {
      name: "uq_fb_accounts_fb_user",
      unique: true,
    });

    await queryInterface.addIndex("fb_accounts", ["user_id"], {
      name: "idx_fb_accounts_user",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("fb_accounts");
  },
};

export default migration;
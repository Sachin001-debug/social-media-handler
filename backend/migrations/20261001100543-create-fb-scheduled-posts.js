"use strict";

/** @type {import('sequelize-cli').Migration} */
const migration = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fb_scheduled_posts", {
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
      fb_account_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "fb_accounts", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      link: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      media_type: {
        type: Sequelize.ENUM("none", "image", "video", "audio"),
        allowNull: false,
        defaultValue: "none",
      },
      media_path: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      media_original_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      media_mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      media_size: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      mode: {
        type: Sequelize.ENUM("now", "schedule"),
        allowNull: false,
        defaultValue: "schedule",
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("pending", "processing", "published", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      fb_post_id: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      published_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("fb_scheduled_posts", ["status", "scheduled_at"], {
      name: "fb_scheduled_posts_status_scheduled_at",
    });
    await queryInterface.addIndex("fb_scheduled_posts", ["user_id"], {
      name: "fb_scheduled_posts_user_id",
    });
    await queryInterface.addIndex("fb_scheduled_posts", ["fb_account_id"], {
      name: "fb_scheduled_posts_fb_account_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("fb_scheduled_posts");
    // Needed on PostgreSQL only (MySQL drops ENUMs with the table):
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fb_scheduled_posts_media_type";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fb_scheduled_posts_mode";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fb_scheduled_posts_status";');
  },
};

export default migration;
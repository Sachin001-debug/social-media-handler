
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("orders", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    user_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    item: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },

    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    total: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },

    status: {
      type: Sequelize.ENUM(
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    phone: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },

    delivery_address: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    payment_method: {
      type: Sequelize.ENUM("cash_on_delivery", "online"),
      allowNull: false,
      defaultValue: "cash_on_delivery",
    },

    payment_status: {
      type: Sequelize.ENUM(
        "pending",
        "paid",
        "failed",
        "refunded"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },

    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("orders");
}

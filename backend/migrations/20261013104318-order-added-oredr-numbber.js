"use strict";

export async function up(queryInterface, Sequelize) {
  // 1. add as nullable first so existing rows don't break
  await queryInterface.addColumn("orders", "order_number", {
    type: Sequelize.INTEGER,
    allowNull: true,
  });

  // 2. backfill old orders (use their id as the number)
  await queryInterface.sequelize.query(
    "UPDATE orders SET order_number = id WHERE order_number IS NULL"
  );

  // 3. make it NOT NULL
  await queryInterface.changeColumn("orders", "order_number", {
    type: Sequelize.INTEGER,
    allowNull: false,
  });

  // 4. optional but recommended: no two orders share a number
  await queryInterface.addIndex("orders", ["order_number"], {
    unique: true,
    name: "orders_order_number_unique",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex("orders", "orders_order_number_unique");
  await queryInterface.removeColumn("orders", "order_number");
}
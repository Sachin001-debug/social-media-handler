"use strict";

export async function up(queryInterface, Sequelize) {
  // 1. add as nullable first so existing rows don't break
  await queryInterface.addColumn("orders", "fb_username", {
    type: Sequelize.STRING(100),
    allowNull: true,
  });

  // 2. backfill old orders
  await queryInterface.sequelize.query(
    "UPDATE orders SET fb_username = 'unknown' WHERE fb_username IS NULL"
  );

  // 3. now make it NOT NULL
  await queryInterface.changeColumn("orders", "fb_username", {
    type: Sequelize.STRING(100),
    allowNull: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("orders", "fb_username");
}
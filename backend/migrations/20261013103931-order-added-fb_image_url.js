"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("orders", "fb_image", {
    type: Sequelize.STRING(500),
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("orders", "fb_image");
}
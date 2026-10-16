"use strict";

async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("orders", "fb_sender_id", {
    type: Sequelize.STRING(64),
    allowNull: true,
  });
}

async function down(queryInterface) {
  await queryInterface.removeColumn("orders", "fb_sender_id");
}

export default { up, down };

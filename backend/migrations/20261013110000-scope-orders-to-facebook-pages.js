"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.renameColumn("orders", "user_name", "client_name");

  await queryInterface.addColumn("orders", "fb_account_id", {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: "fb_accounts",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  await queryInterface.addIndex("orders", ["fb_account_id"], {
    name: "orders_fb_account_id_index",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex("orders", "orders_fb_account_id_index");
  await queryInterface.removeColumn("orders", "fb_account_id");
  await queryInterface.renameColumn("orders", "client_name", "user_name");
}

export default { up, down };

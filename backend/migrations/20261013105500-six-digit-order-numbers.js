"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(
    "UPDATE orders SET order_number = LPAD(id, 6, '0')"
  );

  await queryInterface.changeColumn("orders", "order_number", {
    type: Sequelize.STRING(6),
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("orders", "order_number", {
    type: Sequelize.STRING(40),
    allowNull: false,
  });

  await queryInterface.sequelize.query(
    "UPDATE orders SET order_number = CONCAT('ORD-', LPAD(id, 8, '0'))"
  );
}

export default { up, down };

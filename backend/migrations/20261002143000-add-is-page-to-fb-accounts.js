"use strict";

const migration = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("fb_accounts", "is_page", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("fb_accounts", "is_page");
  },
};

export default migration;

import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_number: {
        type: DataTypes.STRING(6),
        allowNull: false,
        unique: true,
      },
      client_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      fbAccountId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: "fb_account_id",
      },
      fb_username: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      fb_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      fb_sender_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: "fb_sender_id",
      },
      item: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          isInt: true,
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM(
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
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      delivery_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM("cash_on_delivery", "online"),
        allowNull: false,
        defaultValue: "cash_on_delivery",
      },
      payment_status: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      underscored: false,
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.FbAccount, {
      foreignKey: { name: "fbAccountId", field: "fb_account_id" },
      as: "facebookAccount",
      onDelete: "SET NULL",
    });
  };

  return Order;
};

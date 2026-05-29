const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'firstName'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lastName'
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    customerCode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'customerCode'
    },
    password: {

      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'CUSTOMER'),
      defaultValue: 'CUSTOMER',
    },
    isFirstLogin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'isFirstLogin'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'ACTIVE',
    },
    isKycVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'isKycVerified'
    },
    profileImage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profileImage'
    },
    passwordUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'passwordUpdatedAt'
    }

  }, {
    timestamps: true,
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = (models) => {
    User.belongsTo(models.Customer, { foreignKey: 'customerCode', targetKey: 'customerCode', as: 'customer' });
  };

  return User;
};


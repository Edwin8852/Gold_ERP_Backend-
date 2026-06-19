module.exports = (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    settingKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'settingKey'
    },
    settingValue: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'settingValue'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'description'
    }
  }, {
    timestamps: true,
    tableName: 'system_settings'
  });

  return SystemSetting;
};

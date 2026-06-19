const { SystemSetting } = require('../../models');

exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { settingKey } = req.params;
    const { settingValue } = req.body;

    let setting = await SystemSetting.findOne({ where: { settingKey } });
    if (!setting) {
      setting = await SystemSetting.create({ settingKey, settingValue });
    } else {
      setting.settingValue = settingValue;
      await setting.save();
    }

    res.status(200).json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

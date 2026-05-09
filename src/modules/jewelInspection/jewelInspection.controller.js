const jewelInspectionService = require('./jewelInspection.service');

const createInspection = async (req, res) => {
  try {
    const inspectionData = req.body;
    if (req.file) {
      inspectionData.damagePhoto = req.file.path;
    }

    const inspection = await jewelInspectionService.createInspection(inspectionData, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Jewel inspection created successfully',
      data: inspection,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getInspections = async (req, res) => {
  try {
    const inspections = await jewelInspectionService.getAllInspections();
    return res.status(200).json({ success: true, data: inspections });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getInspection = async (req, res) => {
  try {
    const inspection = await jewelInspectionService.getInspectionById(req.params.id);
    return res.status(200).json({ success: true, data: inspection });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const updateInspection = async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.damagePhoto = req.file.path;
    }
    const inspection = await jewelInspectionService.updateInspection(req.params.id, updateData);
    return res.status(200).json({
      success: true,
      message: 'Jewel inspection updated successfully',
      data: inspection,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteInspection = async (req, res) => {
  try {
    await jewelInspectionService.deleteInspection(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Jewel inspection deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInspection,
  getInspections,
  getInspection,
  updateInspection,
  deleteInspection
};

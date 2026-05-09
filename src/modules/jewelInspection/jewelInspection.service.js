const JewelInspection = require('../../models/jewelInspection.model');

const createInspection = async (inspectionData, userId) => {
  const inspection = await JewelInspection.create({
    ...inspectionData,
    createdBy: userId,
  });
  return inspection;
};

const getAllInspections = async () => {
  return await JewelInspection.findAll({ order: [['createdAt', 'DESC']] });
};

const getInspectionById = async (id) => {
  const inspection = await JewelInspection.findByPk(id, { include: ['loan'] });
  if (!inspection) throw new Error('Inspection not found');
  return inspection;
};

const updateInspection = async (id, updateData) => {
  const inspection = await getInspectionById(id);
  await inspection.update(updateData);
  return inspection;
};

const deleteInspection = async (id) => {
  const inspection = await getInspectionById(id);
  await inspection.destroy();
  return true;
};

const getInspectionsByLoanId = async (loanId) => {
  return await JewelInspection.findAll({ where: { loanId } });
};

module.exports = {
  createInspection,
  getAllInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  getInspectionsByLoanId
};

const goldFinanceService = require('./goldFinance.service');

const createLoan = async (req, res) => {
  try {
    const loan = await goldFinanceService.createLoan(req.body, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Gold loan created successfully',
      data: loan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getLoans = async (req, res) => {
  try {
    const loans = await goldFinanceService.getAllLoans();
    return res.status(200).json({
      success: true,
      data: loans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getLoan = async (req, res) => {
  try {
    const loan = await goldFinanceService.getLoanById(req.params.id);
    return res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateLoan = async (req, res) => {
  try {
    const loan = await goldFinanceService.updateLoan(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Gold loan updated successfully',
      data: loan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const closeLoan = async (req, res) => {
  try {
    const loan = await goldFinanceService.closeLoan(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Gold loan closed successfully',
      data: loan,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteLoan = async (req, res) => {
  try {
    await goldFinanceService.deleteLoan(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Gold loan deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createLoan,
  getLoans,
  getLoan,
  updateLoan,
  closeLoan,
  deleteLoan
};

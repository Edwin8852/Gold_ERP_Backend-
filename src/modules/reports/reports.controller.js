const reportsService = require('./reports.service');

const getLoanReport = async (req, res) => {
  try {
    const data = await reportsService.generateLoanReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentReport = async (req, res) => {
  try {
    const data = await reportsService.generatePaymentReport(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerReport = async (req, res) => {
  try {
    const data = await reportsService.generateCustomerReport();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLoanReport, getPaymentReport, getCustomerReport };

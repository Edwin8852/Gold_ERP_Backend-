const dashboardService = require('./dashboard.service');

const getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getAdminSummary();
    return res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getRevenue = async (req, res) => {
  try {
    const data = await dashboardService.getRevenueAnalytics();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOverdueLoans = async (req, res) => {
  try {
    const data = await dashboardService.getOverdueLoansList();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminDashboard, getRevenue, getOverdueLoans };

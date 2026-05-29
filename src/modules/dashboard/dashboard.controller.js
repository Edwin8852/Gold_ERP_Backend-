const dashboardService = require('./dashboard.service');

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    return res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await dashboardService.getAnalytics();
    return res.status(200).json({
      success: true,
      message: 'Dashboard analytics fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const data = await dashboardService.getActivity();
    return res.status(200).json({
      success: true,
      message: 'Activity feed fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getCharts = async (req, res, next) => {
  try {
    const data = await dashboardService.getCharts();
    return res.status(200).json({
      success: true,
      message: 'Chart data fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getExecutiveStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getExecutiveStats();
    return res.status(200).json({
      success: true,
      message: 'Executive stats fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

const getSecurityLogs = async (req, res, next) => {
  try {
    const data = await dashboardService.getSecurityLogs();
    return res.status(200).json({
      success: true,
      message: 'Security logs fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getAnalytics,
  getActivity,
  getCharts,
  getExecutiveStats,
  getSecurityLogs
};

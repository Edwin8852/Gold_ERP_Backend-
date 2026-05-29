const riskScoringService = require('./riskScoring.service');
const ApiResponse = require('../../shared/utils/apiResponse');

class AIController {
  async runRiskAnalysis(req, res, next) {
    try {
      await riskScoringService.runGlobalRiskAnalysis();
      return ApiResponse.success(res, 'Global risk analysis completed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getHighRiskAccounts(req, res, next) {
    try {
      const data = await riskScoringService.getHighRiskAccounts();
      return ApiResponse.success(res, 'High risk accounts retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  async getCustomerRisk(req, res, next) {
    try {
      const { id } = req.params;
      const score = await riskScoringService.calculateCustomerRisk(id);
      return ApiResponse.success(res, 'Customer risk score calculated', { riskScore: score });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();

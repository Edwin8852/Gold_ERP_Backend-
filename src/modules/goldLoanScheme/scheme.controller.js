const schemeService = require('./scheme.service');
const ApiResponse = require('../../shared/utils/apiResponse');

class SchemeController {
  async create(req, res, next) {
    try {
      const scheme = await schemeService.createScheme(req.body, req.user.id);
      ApiResponse.success(res, 'Scheme created successfully', scheme, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const schemes = await schemeService.getAllSchemes(req.query);
      ApiResponse.success(res, 'Schemes retrieved', schemes);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const scheme = await schemeService.getSchemeById(req.params.id);
      ApiResponse.success(res, 'Scheme details', scheme);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const scheme = await schemeService.updateScheme(req.params.id, req.body);
      ApiResponse.success(res, 'Scheme updated', scheme);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await schemeService.deleteScheme(req.params.id);
      ApiResponse.success(res, 'Scheme deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchemeController();

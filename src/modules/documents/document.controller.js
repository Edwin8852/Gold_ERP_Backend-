const documentService = require('./document.service');
const ApiResponse = require('../../shared/utils/apiResponse');
const path = require('path');
const fs = require('fs');

class DocumentController {
  async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const isCustomer = req.user.role === 'CUSTOMER';
      
      const document = await documentService.uploadDocument({
        customerId: isCustomer ? null : req.body.customerId,
        type: req.body.type,
        fileName: req.file.filename,
        fileUrl: `/uploads/documents/${req.file.filename}`,
        status: 'PENDING'
      }, isCustomer ? req.user.id : null);

      return ApiResponse.success(res, 'Document uploaded successfully', document, 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyDocuments(req, res, next) {
    try {
      const documents = await documentService.getCustomerDocuments(req.user.id);
      return ApiResponse.success(res, 'Documents retrieved successfully', documents);
    } catch (error) {
      next(error);
    }
  }

  async getAllDocuments(req, res, next) {
    try {
      const documents = await documentService.getAllDocuments(req.query);
      return ApiResponse.success(res, 'All documents retrieved successfully', documents);
    } catch (error) {
      next(error);
    }
  }

  async verifyDocument(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentService.verifyDocument(id, req.body, req.user.id);
      return ApiResponse.success(res, 'Document verification updated', document);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();

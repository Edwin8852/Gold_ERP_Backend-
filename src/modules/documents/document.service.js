const { Document, Customer, User } = require('../../models');

class DocumentService {
  async _getCustomerByUserId(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    const customer = await Customer.findOne({ where: { customerCode: user.customerCode } });
    if (!customer) throw new Error('Customer profile not found for this user');
    return customer;
  }

  /**
   * Upload/Create a document record
   */
  async uploadDocument(data, userId = null) {
    let customerId = data.customerId;
    
    // If uploading as a customer, resolve the actual customerId from userId
    if (userId) {
      const customer = await this._getCustomerByUserId(userId);
      customerId = customer.id;
    }

    if (!customerId) throw new Error('Customer ID is required');

    return await Document.create({
      ...data,
      customerId
    });
  }

  /**
   * Get all documents for a customer
   */
  async getCustomerDocuments(userId) {
    const customer = await this._getCustomerByUserId(userId);
    return await Document.findAll({
      where: { customerId: customer.id },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get all documents for verification (Admin Action)
   */
  async getAllDocuments(filters = {}) {
    return await Document.findAll({
      where: filters,
      include: [
        { model: Customer, as: 'customer', attributes: ['firstName', 'lastName', 'customerCode'] },
        { model: User, as: 'verifier', attributes: ['firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Verify/Reject a document (Admin Action)
   */
  async verifyDocument(documentId, verificationData, adminId) {
    const document = await Document.findByPk(documentId);
    if (!document) throw new Error('Document not found');

    return await document.update({
      status: verificationData.status,
      remarks: verificationData.remarks,
      verifiedBy: adminId
    });
  }
}

module.exports = new DocumentService();

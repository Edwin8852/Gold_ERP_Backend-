const { Customer, User } = require('../../models');
const AppError = require('../../shared/utils/AppError');

class KycService {
  async submitKyc(customerId, kycData, files) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) throw new AppError('Customer profile not found', 404);

    const kycDocuments = {
      aadharFront: files.kycAadharFront ? files.kycAadharFront[0].path : null,
      aadharBack: files.kycAadharBack ? files.kycAadharBack[0].path : null,
      panCard: files.kycPanCard ? files.kycPanCard[0].path : null,
      addressProof: files.kycAddressProof ? files.kycAddressProof[0].path : null,
    };

    return await customer.update({
      aadharNumber: kycData.aadharNumber,
      panNumber: kycData.panNumber,
      photo: files.photo ? files.photo[0].path : customer.photo,
      signature: files.signature ? files.signature[0].path : customer.signature,
      addressProof: kycDocuments.addressProof,
      kycDocuments,
      kycStatus: 'PENDING',
      isKycVerified: false
    });
  }

  async getKycStatus(customerId) {
    const customer = await Customer.findByPk(customerId, {
      attributes: ['kycStatus', 'isKycVerified', 'aadharNumber', 'panNumber', 'kycDocuments']
    });
    if (!customer) throw new AppError('Customer profile not found', 404);
    return customer;
  }

  async approveKyc(customerId, adminId) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) throw new AppError('Customer not found', 404);

    await customer.update({
      kycStatus: 'VERIFIED',
      isKycVerified: true,
      riskScore: 10, // Initial safe score
      lastRiskUpdate: new Date()
    });

    // Also update associated user account
    const user = await User.findOne({ where: { customerCode: customer.customerCode } });
    if (user) {
      await user.update({ isKycVerified: true });
    }

    return customer;
  }

  async rejectKyc(customerId, reason, adminId) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) throw new AppError('Customer not found', 404);

    return await customer.update({
      kycStatus: 'REJECTED',
      isKycVerified: false,
      remarks: reason
    });
  }
}

module.exports = new KycService();

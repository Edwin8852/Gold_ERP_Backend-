const ChitMember = require('../../models/chitMember.model');
const ChitPayment = require('../../models/chitPayment.model');
const Notification = require('../../models/notification.model'); // Assuming notification model exists

const processMonthlyMissedPayments = async (chitMemberId) => {
  const member = await ChitMember.findByPk(chitMemberId);
  if (!member) throw new Error('Member not found');

  // Logic to determine if payment was missed
  // In a real scenario, this would be a bulk job running every month.
  // For this module, we implement the increment and inactivation logic.
  
  member.missedMonths += 1;

  if (member.missedMonths >= 3) {
    member.memberStatus = 'INACTIVE';
    member.inactiveReason = 'Member inactive due to 3 continuous missed payments';
    
    // Generate Notification
    await Notification.create({
      userId: member.customerId, // Assuming customerId is the user to notify
      message: 'Your chit account has been temporarily inactive due to 3 unpaid monthly installments.',
      type: 'CHIT_ALERT',
      createdBy: member.createdBy
    });
  }

  await member.save();
  return member;
};

const reactivateMember = async (memberId, userId) => {
  const member = await ChitMember.findByPk(memberId);
  if (!member) throw new Error('Member not found');

  member.missedMonths = 0;
  member.memberStatus = 'ACTIVE';
  member.inactiveReason = null;
  member.reactivatedAt = new Date();
  
  await member.save();
  return member;
};

const getInactiveMembers = async () => {
  return await ChitMember.findAll({
    where: { memberStatus: 'INACTIVE' },
    include: ['customerId'] // Adjust based on associations
  });
};

const getMissedMembers = async () => {
  return await ChitMember.findAll({
    where: { missedMonths: { [require('sequelize').Op.gt]: 0 } }
  });
};

module.exports = {
  processMonthlyMissedPayments,
  reactivateMember,
  getInactiveMembers,
  getMissedMembers
};

const chitFundService = require('./chitFund.service');

const reactivate = async (req, res) => {
  try {
    const member = await chitFundService.reactivateMember(req.params.memberId, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Member reactivated successfully',
      data: member
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getInactive = async (req, res) => {
  try {
    const data = await chitFundService.getInactiveMembers();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMissed = async (req, res) => {
  try {
    const data = await chitFundService.getMissedMembers();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { reactivate, getInactive, getMissed };

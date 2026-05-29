const { Ticket, Customer, User, Notification, sequelize } = require('../../models');
const NotificationService = require('../notification/notification.service');

class SupportService {
  /**
   * Create a new support ticket (Customer Action)
   */
  async createTicket(data) {
    // Auto-Priority Logic
    let priority = data.priority || 'MEDIUM';
    const urgentKeywords = ['urgent', 'emergency', 'failed', 'stolen', 'lost', 'stuck', 'error'];
    const textToScan = (data.subject + ' ' + data.description).toLowerCase();
    
    if (urgentKeywords.some(keyword => textToScan.includes(keyword))) {
      priority = 'URGENT';
    } else if (data.category === 'PAYMENT' || data.category === 'KYC') {
      priority = 'HIGH';
    }

    const ticket = await Ticket.create({
      ...data,
      priority
    });

    // Notify Admins about new ticket
    NotificationService.createNotification({
      type: 'TICKET_CREATED',
      message: `New support ticket #${ticket.id.substring(0, 8)}: ${ticket.subject}`,
      isAdmin: true // This would be handled by a global admin notification system
    }).catch(err => console.error('Support Notification Error:', err.message));

    return ticket;
  }

  /**
   * Get all tickets for a specific customer
   */
  async getCustomerTickets(customerId) {
    return await Ticket.findAll({
      where: { customerId },
      order: [['updatedAt', 'DESC']]
    });
  }

  /**
   * Get all tickets (Admin/Super Admin Action)
   */
  async getAllTickets(filters = {}) {
    try {
      console.log('[SupportService] getAllTickets called with filters:', JSON.stringify(filters));
      const tickets = await Ticket.findAll({
        where: filters,
        include: [
          { 
            model: Customer, 
            as: 'customer', 
            attributes: ['firstName', 'lastName', 'customerCode', 'mobileNumber'] 
          },
          { 
            model: User, 
            as: 'resolver', 
            attributes: ['firstName', 'lastName'] 
          }
        ],
        order: [
          [Ticket.sequelize.literal("CASE WHEN priority = 'URGENT' THEN 1 WHEN priority = 'HIGH' THEN 2 WHEN priority = 'MEDIUM' THEN 3 ELSE 4 END"), 'ASC'],
          ['updatedAt', 'DESC']
        ]
      });
      console.log(`[SupportService] Found ${tickets.length} tickets`);
      return tickets;
    } catch (error) {
      console.error('[SupportService] Error in getAllTickets:', error);
      throw error;
    }
  }

  /**
   * Resolve/Respond to a ticket (Admin Action)
   */
  async respondToTicket(ticketId, responseData, adminId) {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const updatedTicket = await ticket.update({
      adminResponse: responseData.response,
      status: responseData.status || 'RESOLVED',
      resolvedBy: adminId
    });

    // Notify Customer
    NotificationService.createNotification({
      customerId: ticket.customerId,
      type: 'TICKET_UPDATED',
      message: `Support Response: Your ticket #${ticket.id.substring(0, 8)} has been updated: ${responseData.status}`,
      ticketId: ticket.id
    }).catch(err => console.error('Customer Notification Error:', err.message));

    return updatedTicket;
  }

  /**
   * Get Ticket Details
   */
  async getTicketDetails(ticketId) {
    return await Ticket.findByPk(ticketId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'resolver' }
      ]
    });
  }
}

module.exports = new SupportService();

const { Notification, Customer, sequelize } = require('./src/models');

const seedNotifications = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Get a sample customer
    const customer = await Customer.findOne();
    if (!customer) {
      console.log('No customers found. Please seed customers first.');
      process.exit(1);
    }

    const notifications = [
      {
        customerId: customer.id,
        message: 'Interest for loan GL-2024-001 is due in 2 days. Amount: ₹1,250.',
        type: 'GOLD_LOAN_INTEREST',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      },
      {
        customerId: customer.id,
        message: 'Your monthly contribution of ₹5,000 for May has been received.',
        type: 'PAYMENT_RECEIVED',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        customerId: customer.id,
        message: 'Order #ORD-998 has been confirmed and sent for inspection.',
        type: 'ORDER_ALERT',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      }
    ];

    await Notification.destroy({ where: {}, truncate: false });
    await Notification.bulkCreate(notifications);

    console.log('Sample notifications seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
};

seedNotifications();

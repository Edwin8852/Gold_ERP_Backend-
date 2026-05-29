const { sequelize, User, Role } = require('../src/models');
const roles = require('../src/shared/constants/roles');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    await sequelize.authenticate();
    
    // Optional: sync tables if you want to make sure they exist, but we assume they do
    // await sequelize.sync(); 
    
    console.log('🌱 Seeding default credentials...');

    const defaultUsers = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'super@gmail.com',
        mobile: '9999999999',
        password: 'super@321', // Note: User model hook will hash this
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isKycVerified: true,
        isFirstLogin: false
      },
      {
        firstName: 'Admin',
        lastName: 'Manager',
        email: 'admin@gmail.com',
        mobile: '8888888888',
        password: 'admin@321',
        role: 'ADMIN',
        status: 'ACTIVE',
        isKycVerified: true,
        isFirstLogin: false
      },
      {
        firstName: 'Pavithra',
        lastName: 'Customer',
        email: 'kcpavithra23@gmail.com',
        mobile: '7777777777',
        password: 'pavi@321',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isKycVerified: true,
        isFirstLogin: false
      }
    ];

    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (!existingUser) {
        await User.create(userData);
        console.log(`✅ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`ℹ️ ${userData.role} already exists: ${userData.email}`);
      }
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();

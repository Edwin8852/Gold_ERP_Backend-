const { sequelize, Role } = require('../src/models');
const roles = require('../src/shared/constants/roles');

const seed = async () => {
  try {
    await sequelize.sync({ force: true });
    
    await Role.bulkCreate(
      Object.values(roles).map(name => ({ name }))
    );
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();

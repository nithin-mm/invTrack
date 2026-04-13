const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin', 10);
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: hashedPassword,
        role: 'ADMIN'
      },
      create: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin password has been reset to: admin');
    console.log('User details:', { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();

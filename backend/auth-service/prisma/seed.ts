import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding auth database...');

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const clientPassword = await bcrypt.hash('Client123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@catering.com' },
    update: {},
    create: {
      email: 'admin@catering.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'cliente@example.com' },
    update: {},
    create: {
      email: 'cliente@example.com',
      password: clientPassword,
      name: 'Cliente Demo',
      role: 'CLIENT',
    },
  });

  console.log('✅ Seed completed:');
  console.log(`   Admin: ${admin.email} (ID: ${admin.id})`);
  console.log(`   Client: ${client.email} (ID: ${client.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const vendorPassword = await bcrypt.hash('vendedor123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inmo.com' },
    update: {},
    create: {
      email: 'admin@inmo.com',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const vendors = [
    { email: 'carlos@inmo.com', name: 'Carlos', zone: 'CENTRAL', phone: '595981111111' },
    { email: 'ana@inmo.com', name: 'Ana', zone: 'ITAPUA', phone: '595981222222' },
    { email: 'luis@inmo.com', name: 'Luis', zone: 'CAAGUAZU', phone: '595981333333' },
  ];

  for (const v of vendors) {
    await prisma.user.upsert({
      where: { email: v.email },
      update: { phone: v.phone },
      create: { ...v, password: vendorPassword, role: 'VENDEDOR' },
    });
  }

  console.log('seed completado');
  console.log('  admin@inmo.com / admin123');
  console.log('  carlos@inmo.com / vendedor123');
  console.log('  ana@inmo.com / vendedor123');
  console.log('  luis@inmo.com / vendedor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

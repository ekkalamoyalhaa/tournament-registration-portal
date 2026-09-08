import { PrismaClient, GlobalRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@tournament.local';
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMeNow123!';
  const firstName = process.env.ADMIN_SEED_FIRST_NAME ?? 'Tournament';
  const lastName = process.env.ADMIN_SEED_LAST_NAME ?? 'Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: GlobalRole.SUPER_ADMIN,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Created admin user: ${user.email} (${user.role})`);
  console.log(`Password: ${password}`);
  console.log('Change this password immediately after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
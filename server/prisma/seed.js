import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_ROLE_PRESETS, ROLES } from '../src/config/constants.js';

const prisma = new PrismaClient();

async function upsertRoles() {
  for (const [name, preset] of Object.entries(DEFAULT_ROLE_PRESETS)) {
    await prisma.role.upsert({
      where: { name },
      update: {
        description: preset.description,
        dailyLimit: preset.dailyLimit,
        permissions: preset.permissions,
        isSystem: preset.isSystem,
        status: 'ACTIVE',
      },
      create: {
        name,
        description: preset.description,
        dailyLimit: preset.dailyLimit,
        permissions: preset.permissions,
        isSystem: preset.isSystem,
      },
    });
    console.log(`✓ role: ${name}`);
  }
}

async function upsertAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed.');
    return;
  }

  const adminRole = await prisma.role.findUnique({ where: { name: ROLES.ADMIN } });
  if (!adminRole) throw new Error('Admin role missing after upsertRoles');

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { roleId: adminRole.id, isActive: true, emailVerified: true },
    create: {
      email,
      name,
      passwordHash,
      emailVerified: true,
      isActive: true,
      roleId: adminRole.id,
    },
  });
  console.log(`✓ admin user: ${email}`);
}

async function main() {
  await upsertRoles();
  await upsertAdmin();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

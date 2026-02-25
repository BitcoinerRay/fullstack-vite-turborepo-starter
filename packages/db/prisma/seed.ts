import path from 'node:path';
import process from 'node:process';
import {config} from 'dotenv';
import {PrismaClient} from '@prisma/client';
import {hashSync} from 'bcryptjs';

config({
  path: path.resolve(process.cwd(), '../../.env'),
});

const prisma = new PrismaClient();
const saltRounds = 12;

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: {email: 'admin@example.com'},
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashSync('Admin@12345', saltRounds),
      role: 'ADMIN',
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async (): Promise<void> => {
    await prisma.$disconnect();
  });

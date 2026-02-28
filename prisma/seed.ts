import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BCRYPT_SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // Hash passwords
  const userPassword = await hash('StrongPass123!', BCRYPT_SALT_ROUNDS);
  const clientSecret = await hash('hashed-secret-here', BCRYPT_SALT_ROUNDS);

  // Create dummy user
  const user = await prisma.user.upsert({
    where: { email: 'user01@example.com' },
    update: {},
    create: {
      email: 'user01@example.com',
      password: userPassword,
      isEmailVerified: true,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create client application
  const client = await prisma.clientApplication.upsert({
    where: { clientId: 'mobile-app-prod' },
    update: {},
    create: {
      name: 'My Mobile App',
      clientId: 'mobile-app-prod',
      clientSecret: clientSecret,
      redirectUris: ['myapp://callback', 'https://myapp.com/callback'],
    },
  });

  console.log('✅ Created client:', client.name);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

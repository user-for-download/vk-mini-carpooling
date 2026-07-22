import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Replace with your own city's stops/districts before going live.
const LOCATIONS = [
  { name: 'Central Bus Station', district: 'Downtown' },
  { name: 'North Market', district: 'North District' },
  { name: 'University Campus', district: 'East District' },
  { name: 'Riverside Park', district: 'West District' },
];

async function main() {
  for (const location of LOCATIONS) {
    await prisma.location.upsert({
      where: { id: LOCATIONS.indexOf(location) + 1 },
      update: {},
      create: location,
    });
  }
  console.log(`Seeded ${LOCATIONS.length} locations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

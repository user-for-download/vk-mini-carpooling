import 'dotenv/config';
import { PrismaClient, RideStatus, BookingStatus } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// --- Test Users ---
const DRIVERS = [
  { id: '111111111', firstName: 'Alex', lastName: 'Driver', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '111111112', firstName: 'Maria', lastName: 'Petrova', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '111111113', firstName: 'Dmitry', lastName: 'Sidorov', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '111111114', firstName: 'Elena', lastName: 'Kozlova', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '111111115', firstName: 'Sergey', lastName: 'Mikhailov', photoUrl: 'https://vk.com/images/camera_200.png' },
];

const PASSENGERS = [
  { id: '222222221', firstName: 'Olga', lastName: 'Passenger', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '222222222', firstName: 'Ivan', lastName: 'Smirnov', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '222222223', firstName: 'Anna', lastName: 'Volkova', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '222222224', firstName: 'Pavel', lastName: 'Novikov', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '222222225', firstName: 'Natalia', lastName: 'Morozova', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '222222226', firstName: 'Andrey', lastName: 'Popov', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '222222227', firstName: 'Tatiana', lastName: 'Lebedeva', photoUrl: 'https://vk.com/images/camera_200.png' },
  { id: '222222228', firstName: 'Mikhail', lastName: 'Sokolov', photoUrl: 'https://vk.com/images/camera_200.png' },
];

// --- Helper: random item from array ---
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Helper: random int in range ---
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Helper: hours from now ---
function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 3600 * 1000);
}

async function main() {
  // 1. Upsert all users
  const allUsers = [...DRIVERS, ...PASSENGERS];
  for (const user of allUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
  console.log(`Upserted ${allUsers.length} users (${DRIVERS.length} drivers, ${PASSENGERS.length} passengers).`);

  // 2. Get location IDs
  const locations = await prisma.location.findMany();
  if (locations.length < 2) {
    throw new Error('Run `bun run prisma:seed` first to create locations.');
  }

  // 3. Create rides: each driver publishes 4-6 rides with specific offered seats
  const ALL_SEATS = [1, 2, 3]; // В, Л, П
  const ridesCreated = [];
  for (const driver of DRIVERS) {
    const rideCount = randInt(4, 6);
    for (let i = 0; i < rideCount; i++) {
      // Pick two different locations
      const from = pick(locations);
      let to = pick(locations);
      while (to.id === from.id) to = pick(locations);

      const departure = hoursFromNow(randInt(1, 72)); // 1-72 hours ahead
      // Randomly offer 1 to 3 seats
      const offeredSeats = ALL_SEATS.slice(0, randInt(1, 3));
      const price = randInt(150, 800);

      const ride = await prisma.ride.create({
        data: {
          driverId: driver.id,
          fromId: from.id,
          toId: to.id,
          departureTime: departure,
          seatsAvailable: offeredSeats.length,
          offeredSeats,
          price,
          status: RideStatus.ACTIVE,
        },
      });
      ridesCreated.push(ride);
    }
  }
  console.log(`Created ${ridesCreated.length} active rides.`);

  // 4. Create bookings: 1-3 passengers book each ride with specific seat IDs
  let bookingsCreated = 0;
  for (const ride of ridesCreated) {
    const bookingCount = randInt(1, 3);
    const usedPassengers = new Set<string>();
    let availableSeats = [...ride.offeredSeats]; // Track remaining available seats

    for (let i = 0; i < bookingCount && usedPassengers.size < PASSENGERS.length && availableSeats.length > 0; i++) {
      let passenger: typeof PASSENGERS[0];
      do {
        passenger = pick(PASSENGERS);
      } while (usedPassengers.has(passenger.id));
      usedPassengers.add(passenger.id);

      // Book 1-2 specific seats from available ones
      const numToBook = randInt(1, Math.min(2, availableSeats.length));
      const seatIds = availableSeats.splice(0, numToBook);

      // Mix of statuses for variety
      const statusRoll = Math.random();
      let status: BookingStatus;
      if (statusRoll < 0.4) status = BookingStatus.PENDING;
      else if (statusRoll < 0.75) status = BookingStatus.APPROVED;
      else status = BookingStatus.REJECTED;

      await prisma.booking.create({
        data: {
          rideId: ride.id,
          passengerId: passenger.id,
          seatsBooked: seatIds.length,
          seatIds,
          status,
        },
      });
      bookingsCreated++;
    }
  }
  console.log(`Created ${bookingsCreated} bookings (mixed PENDING/APPROVED/REJECTED).`);

  // 5. Add completed and cancelled rides for realism
  for (let i = 0; i < 3; i++) {
    const offeredSeats = ALL_SEATS.slice(0, randInt(1, 3));
    await prisma.ride.create({
      data: {
        driverId: pick(DRIVERS).id,
        fromId: pick(locations).id,
        toId: pick(locations).id,
        departureTime: hoursFromNow(-24 - i * 12),
        seatsAvailable: offeredSeats.length,
        offeredSeats,
        price: randInt(200, 600),
        status: RideStatus.COMPLETED,
      },
    });
  }
  for (let i = 0; i < 2; i++) {
    const offeredSeats = ALL_SEATS.slice(0, randInt(1, 3));
    await prisma.ride.create({
      data: {
        driverId: pick(DRIVERS).id,
        fromId: pick(locations).id,
        toId: pick(locations).id,
        departureTime: hoursFromNow(-12 - i * 6),
        seatsAvailable: offeredSeats.length,
        offeredSeats,
        price: randInt(150, 500),
        status: RideStatus.CANCELLED,
      },
    });
  }
  console.log('Created 3 completed rides and 2 cancelled rides.');

  // Summary
  const totals = {
    users: await prisma.user.count(),
    rides: await prisma.ride.count(),
    bookings: await prisma.booking.count(),
  };
  console.log('\n--- Database totals ---');
  console.log(`Users:    ${totals.users}`);
  console.log(`Rides:    ${totals.rides}`);
  console.log(`Bookings: ${totals.bookings}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

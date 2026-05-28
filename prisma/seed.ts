import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const scooterModels = [
  "Xiaomi Pro 2",
  "Segway Ninebot",
  "Niu MQi+",
  "Kugoo G2 Pro",
  "Kaabo Wolf Warrior",
];

const algiersCentre = { lat: 36.7538, lng: 3.0588 };

function randomAround(base: number, spread: number) {
  return base + (Math.random() - 0.5) * spread;
}

const statuses = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "RENTED", "RENTED", "MAINTENANCE"];

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@scoot.dz" },
    update: {},
    create: {
      email: "admin@scoot.dz",
      name: "Admin Scoot",
      phone: "+213 555 000 001",
      password: adminPassword,
      role: "ADMIN",
      active: true,
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create rider user
  const riderPassword = await bcrypt.hash("Rider123!", 10);
  const rider = await prisma.user.upsert({
    where: { email: "rider@scoot.dz" },
    update: {},
    create: {
      email: "rider@scoot.dz",
      name: "Karim Bensalem",
      phone: "+213 555 000 002",
      password: riderPassword,
      role: "RIDER",
      active: true,
    },
  });
  console.log("✅ Rider user created:", rider.email);

  // Create 15 scooters around Algiers
  const scooterData = Array.from({ length: 15 }, (_, i) => {
    const status = statuses[i % statuses.length];
    const battery = Math.floor(Math.random() * 60) + 40; // 40-100%
    const model = scooterModels[i % scooterModels.length];
    const lat = randomAround(algiersCentre.lat, 0.04);
    const lng = randomAround(algiersCentre.lng, 0.04);

    return {
      name: `Scooter ${String(i + 1).padStart(2, "0")}`,
      code: `ALG${String(i + 1).padStart(3, "0")}`,
      status,
      battery,
      lat,
      lng,
      model,
      pricePerMin: 2.5,
      maxSpeed: 25,
      color: "#10b981",
      lastPing: new Date(),
      address: `Alger, quartier ${i + 1}`,
    };
  });

  let scooterCount = 0;
  for (const data of scooterData) {
    await prisma.scooter.upsert({
      where: { code: data.code },
      update: {},
      create: data,
    });
    scooterCount++;
  }
  console.log(`✅ ${scooterCount} scooters created around Algiers`);

  console.log("🎉 Seeding complete!");
  console.log("   Admin: admin@scoot.dz / Admin123!");
  console.log("   Rider: rider@scoot.dz / Rider123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

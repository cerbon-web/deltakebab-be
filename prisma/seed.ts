import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function shouldSeedDatabase(): Promise<boolean> {
  const [userCount, roleCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
  ]);

  return userCount === 0 && roleCount === 0;
}

async function main() {
  const shouldSeed = await shouldSeedDatabase();

  if (!shouldSeed) {
    console.log("ℹ️ Database already contains seed data. Skipping seed.");
    return;
  }

  console.log("🌱 Seeding database...");

  // ============================================================================
  // ROLES
  // ============================================================================
  console.log("📋 Creating roles...");
  const roleNames = [
    "SUPER_ADMIN",
    "RESTAURANT_ADMIN",
    "KITCHEN",
    "DRIVER",
    "REPORTER",
    "CUSTOMER",
  ];
  const roles: Record<string, string> = {};

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roles[name] = role.id;
    console.log(`  ✓ Created role: ${name}`);
  }

  // ============================================================================
  // USERS
  // ============================================================================
  console.log("👥 Creating test users...");

  // Super Admin
  const adminPasswordHash = await bcryptjs.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@delta.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@delta.local",
      phone: "+48 739 659 985",
      passwordHash: adminPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["SUPER_ADMIN"],
        },
      },
    },
    include: { roles: true },
  });
  console.log(`  ✓ Created super admin: ${admin.email}`);

  // Kitchen Staff
  const kitchenPasswordHash = await bcryptjs.hash("kitchen123", 10);
  const kitchenStaff = await prisma.user.upsert({
    where: { email: "kitchen@delta.local" },
    update: {},
    create: {
      name: "Kitchen Staff",
      email: "kitchen@delta.local",
      phone: "+48 111 222 333",
      passwordHash: kitchenPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["KITCHEN"],
        },
      },
    },
  });
  console.log(`  ✓ Created kitchen staff: ${kitchenStaff.email}`);

  // Driver
  const driverPasswordHash = await bcryptjs.hash("driver123", 10);
  const driver = await prisma.user.upsert({
    where: { email: "driver@delta.local" },
    update: {},
    create: {
      name: "Test Driver",
      email: "driver@delta.local",
      phone: "+48 444 555 666",
      passwordHash: driverPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["DRIVER"],
        },
      },
    },
  });
  console.log(`  ✓ Created driver: ${driver.email}`);

  // Customer
  const customerPasswordHash = await bcryptjs.hash("customer123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "customer@delta.local" },
    update: {},
    create: {
      name: "Test Customer",
      email: "customer@delta.local",
      phone: "+48 777 888 999",
      passwordHash: customerPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["CUSTOMER"],
        },
      },
    },
  });
  console.log(`  ✓ Created customer: ${customer.email}`);

  // ============================================================================
  // RESTAURANTS & BRANCHES
  // ============================================================================
  console.log("🍽️ Creating restaurants and branches...");

  const branchSeedData = [
    {
      id: "delta-kebab-branch-1",
      name: "Delta Kebab - Cieplewo",
      street: "Długa",
      buildingNumber: "101a/Lokal 7",
      city: "Cieplewo",
      postalCode: "83-031",
      latitude: 54.232071,
      longitude: 18.643799,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-2",
      name: "Delta Kebab - Kowale",
      street: "Apollina",
      buildingNumber: "16/2",
      city: "Kowale",
      postalCode: "80-180",
      latitude: 54.306059,
      longitude: 18.569809,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-3",
      name: "Delta Kebab - Pruszcz Gdański",
      street: "Chopina",
      buildingNumber: "2",
      city: "Pruszcz Gdański",
      postalCode: "83-000",
      latitude: 54.261974,
      longitude: 18.636377,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-4",
      name: "Delta Kebab - Starogard Gdański (Rynek)",
      street: "Rynek",
      buildingNumber: "38",
      city: "Starogard Gdański",
      postalCode: "83-200",
      latitude: 53.967822,
      longitude: 18.532756,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-5",
      name: "Delta Kebab - Starogard Gdański (Nowowiejska)",
      street: "Droga Nowowiejska",
      buildingNumber: "1A",
      city: "Starogard Gdański",
      postalCode: "83-200",
      latitude: 53.965418,
      longitude: 18.515419,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-tczew-main",
      name: "Delta Kebab - Tczew (Jodłowa)",
      street: "Jodłowa",
      buildingNumber: "11A",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.097471,
      longitude: 18.768975,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-7",
      name: "Delta Kebab - Tczew (Wojska Polskiego)",
      street: "Wojska Polskiego",
      buildingNumber: "28",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.088359,
      longitude: 18.787189,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-8",
      name: "Delta Kebab - Tuchola",
      street: "Świecka",
      buildingNumber: "26",
      city: "Tuchola",
      postalCode: "89-500",
      latitude: 53.586364,
      longitude: 17.861473,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-9",
      name: "Delta Kebab - Lidzbark",
      street: "Plac Generała Józefa Hallera",
      buildingNumber: "2",
      city: "Lidzbark",
      postalCode: "13-230",
      latitude: 53.262713,
      longitude: 19.822296,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-10",
      name: "Delta Kebab - Olsztynek",
      street: "Warszawska",
      buildingNumber: "8",
      city: "Olsztynek",
      postalCode: "11-015",
      latitude: 53.582472,
      longitude: 20.283026,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-11",
      name: "Delta Kebab - Kętrzyn",
      street: "Adama Mickiewicza",
      buildingNumber: "2",
      city: "Kętrzyn",
      postalCode: "11-400",
      latitude: 54.076653,
      longitude: 21.374531,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-12",
      name: "Delta Kebab - Wrzeszcz",
      street: "Klonowa",
      buildingNumber: "1/43",
      city: "Gdańsk",
      postalCode: "80-264",
      latitude: 54.380591,
      longitude: 18.603988,
      phone: null,
      active: true,
    },
  ];
  // branches.json is no longer used and can be removed from the project

  const restaurant = await prisma.restaurant.upsert({
    where: { id: "delta-kebab-tczew" },
    update: {},
    create: {
      id: "delta-kebab-tczew",
      name: "Delta Kebab",
      active: true,
    },
  });
  console.log(`  ✓ Created restaurant: ${restaurant.name}`);

  const branch = await prisma.branch.upsert({
    where: { id: "delta-kebab-tczew-main" },
    update: {},
    create: {
      id: "delta-kebab-tczew-main",
      restaurantId: restaurant.id,
      name: "Tczew - Main Branch",
      street: "ul. Jodłowa",
      buildingNumber: "11A",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.097471,
      longitude: 18.768975,
      phone: "739 659 985",
      active: true,
    },
  });
  console.log(`  ✓ Created branch: ${branch.name}`);

  for (const branchData of branchSeedData) {
    const seededBranch = await prisma.branch.upsert({
      where: { id: branchData.id },
      update: {},
      create: {
        restaurantId: restaurant.id,
        ...branchData,
      },
    });
    console.log(`  ✓ Created branch: ${seededBranch.name}`);
  }

  // ============================================================================
  // RESTAURANT CONFIGURATION
  // ============================================================================
  console.log("⚙️  Creating restaurant configuration...");

  // Restaurant Info
  const info = await prisma.restaurantInfo.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      packagingFee: 1.5,
      plasticBagFee: 1.0,
    },
  });
  console.log(`  ✓ Created restaurant info`);

  // Opening Hours
  const hours = [
    { dayRange: 0, openTime: "10:00", closeTime: "24:00" }, // Monday
    { dayRange: 1, openTime: "10:00", closeTime: "24:00" }, // Tuesday
    { dayRange: 2, openTime: "10:00", closeTime: "24:00" }, // Wednesday
    { dayRange: 3, openTime: "10:00", closeTime: "24:00" }, // Thursday
    { dayRange: 4, openTime: "10:00", closeTime: "02:00" }, // Friday
    { dayRange: 5, openTime: "10:00", closeTime: "02:00" }, // Saturday
    { dayRange: 6, openTime: "10:00", closeTime: "24:00" }, // Sunday
  ];

  for (const hour of hours) {
    await prisma.restaurantHours.upsert({
      where: { restaurantId_dayRange: { restaurantId: restaurant.id, dayRange: hour.dayRange } },
      update: { openTime: hour.openTime, closeTime: hour.closeTime },
      create: {
        restaurantId: restaurant.id,
        ...hour,
      },
    });
  }
  console.log(`  ✓ Created opening hours for all days`);

  // Delivery Rules
  const deliveryRules = await prisma.restaurantDeliveryRules.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      minOrderValue: 40.0,
      minDeliveryDistance: 0.0,
      maxDeliveryDistance: 20.0,
      baseFee: 5.0,
      perKmFee: 2.0,
    },
  });
  console.log(`  ✓ Created delivery rules`);

  // ============================================================================
  // STAFF ASSIGNMENTS
  // ============================================================================
  console.log("👨‍💼 Assigning staff to branches...");

  await prisma.restaurantStaff.upsert({
    where: {
      userId_branchId: {
        userId: kitchenStaff.id,
        branchId: branch.id,
      },
    },
    update: {},
    create: {
      userId: kitchenStaff.id,
      branchId: branch.id,
    },
  });
  console.log(`  ✓ Assigned kitchen staff to branch`);

  // ============================================================================
  // DRIVER PROFILE
  // ============================================================================
  console.log("🚗 Creating driver profile...");

  const driverProfile = await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      active: true,
      vehicleInfo: {
        type: "motorcycle",
        plate: "DLT-001",
        color: "black",
      },
    },
  });
  console.log(`  ✓ Created driver profile`);

  // ============================================================================
  // CUSTOMER ADDRESS
  // ============================================================================
  console.log("📍 Creating customer addresses...");

  const address = await prisma.customerAddress.upsert({
    where: { id: "customer-addr-1" },
    update: {},
    create: {
      id: "customer-addr-1",
      userId: customer.id,
      label: "Home",
      street: "ul. Główna",
      buildingNumber: "42",
      apartmentNumber: "5",
      floor: "2",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.089456,
      longitude: 18.777129,
      accessNotes: "Ring intercom number 25, entrance from back side",
      active: true,
    },
  });
  console.log(`  ✓ Created customer address`);

  // ============================================================================
  // MENU SYSTEM - CATEGORIES, ITEMS, SIZES, PRICES
  // ============================================================================
  console.log("🍴 Creating menu structure...");

  // Sizes
  const sizeData = [
    { id: "size-small", name: "Małe / Mała / Mały" },
    { id: "size-medium", name: "Średnie / Średnia / Średni" },
    { id: "size-large", name: "Mega / Duża / Duży" },
    { id: "size-033l", name: "0.33L" },
    { id: "size-05l", name: "0.5L" },
  ];

  const sizes: Record<string, string> = {};
  for (const size of sizeData) {
    const s = await prisma.size.upsert({
      where: { name: size.name },
      update: {},
      create: size,
    });
    sizes[size.id] = s.id;
  }
  console.log(`  ✓ Created ${sizeData.length} sizes`);

  // Categories
  const categoryData = [
    { id: "cat-rollo", name: "Rollo" },
    { id: "cat-tortilla", name: "Tortilla" },
    { id: "cat-talerz", name: "Talerz" },
    { id: "cat-box", name: "Box" },
    { id: "cat-bulka", name: "Bułka" },
    { id: "cat-kapsalon", name: "Kapsalon" },
    { id: "cat-kurczak", name: "Kurczak" },
    { id: "cat-salatki", name: "Sałatki" },
    { id: "cat-dodatki", name: "Dodatki" },
    { id: "cat-napoje", name: "Napoje" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories[cat.id] = c.id;
  }
  console.log(`  ✓ Created ${categoryData.length} categories`);

  // Items
  interface ItemData {
    id: string;
    categoryId: string;
    name: string;
    description?: string;
  }

  interface ItemPriceData {
    itemId: string;
    sizeId: string | null;
    price: number;
  }

  const itemsData: ItemData[] = [
    // Rollo
    { id: "item-1", categoryId: "cat-rollo", name: "ROLLO DELTA KEBAB" },
    { id: "item-2", categoryId: "cat-rollo", name: "ROLLO DELTA KEBAB Z SEREM" },
    { id: "item-3", categoryId: "cat-rollo", name: "DELTA AMERYKAŃSKIE" },
    { id: "item-4", categoryId: "cat-rollo", name: "ROLLO DELTA SAMO MIĘSO" },
    { id: "item-5", categoryId: "cat-rollo", name: "SUPER ROLLO DELTA" },
    { id: "item-6", categoryId: "cat-rollo", name: "SZPINAK ROLLO DELTA" },
    { id: "item-7", categoryId: "cat-rollo", name: "ROLLO WEGE" },
    { id: "item-8", categoryId: "cat-rollo", name: "SUPER MEGA ROLLO AMERYKAŃSKIE" },
    { id: "item-9", categoryId: "cat-rollo", name: "SUPER MEGA ROLLO Z SEREM" },
    { id: "item-10", categoryId: "cat-rollo", name: "ROLLO DELTA GREKO" },
    { id: "item-11", categoryId: "cat-rollo", name: "ROLLO DELTA HOT SPICY" },
    { id: "item-12", categoryId: "cat-rollo", name: "ROLLO WRAP" },
    // Tortilla
    { id: "item-13", categoryId: "cat-tortilla", name: "TORTILLA DELTA" },
    { id: "item-14", categoryId: "cat-tortilla", name: "TORTILLA DELTA Z SEREM" },
    { id: "item-15", categoryId: "cat-tortilla", name: "TORTILLA AMERYKAŃSKA" },
    { id: "item-16", categoryId: "cat-tortilla", name: "TORTILLA SAMO MIĘSO" },
    // Talerz
    { id: "item-17", categoryId: "cat-talerz", name: "TALERZ KEBAB" },
    { id: "item-18", categoryId: "cat-talerz", name: "SUPER TALERZ" },
    { id: "item-19", categoryId: "cat-talerz", name: "MEGA TALERZ" },
    { id: "item-20", categoryId: "cat-talerz", name: "TALERZ SAMO MIĘSO" },
    { id: "item-21", categoryId: "cat-talerz", name: "TALERZ FALAFEL" },
    // Box
    { id: "item-22", categoryId: "cat-box", name: "KEBAB BOX" },
    { id: "item-23", categoryId: "cat-box", name: "BOX AMERYKAŃSKI" },
    { id: "item-24", categoryId: "cat-box", name: "KIDS BOX" },
    // Bułka
    { id: "item-25", categoryId: "cat-bulka", name: "KEBAB W BUŁCE" },
    { id: "item-26", categoryId: "cat-bulka", name: "AMERYKAŃSKA" },
    { id: "item-27", categoryId: "cat-bulka", name: "SUPER DELTA W BUŁCE" },
    { id: "item-28", categoryId: "cat-bulka", name: "BUŁKA SAMO MIĘSO" },
    // Kapsalon
    { id: "item-29", categoryId: "cat-kapsalon", name: "KAPSALON" },
    // Kurczak
    { id: "item-30", categoryId: "cat-kurczak", name: "DELTOPYCHA" },
    { id: "item-31", categoryId: "cat-kurczak", name: "CHICKEN STRIPS" },
    { id: "item-32", categoryId: "cat-kurczak", name: "CHICKEN POPS" },
    // Sałatki
    { id: "item-33", categoryId: "cat-salatki", name: "SAŁATKA Z KEBABEM" },
    { id: "item-34", categoryId: "cat-salatki", name: "CRISPY SALAD" },
    { id: "item-35", categoryId: "cat-salatki", name: "GRECKA" },
    // Dodatki
    { id: "item-36", categoryId: "cat-dodatki", name: "FRYTKI" },
    { id: "item-37", categoryId: "cat-dodatki", name: "FRYTKI Z SEREM" },
    { id: "item-38", categoryId: "cat-dodatki", name: "BAKLAWA" },
    { id: "item-39", categoryId: "cat-dodatki", name: "DODATKOWE MIĘSO" },
    { id: "item-40", categoryId: "cat-dodatki", name: "DODATKOWE WARZYWA" },
    { id: "item-41", categoryId: "cat-dodatki", name: "DODATKOWY SER" },
    { id: "item-42", categoryId: "cat-dodatki", name: "DODATKOWY SOS" },
    { id: "item-43", categoryId: "cat-dodatki", name: "KULKI WARZYWNE" },
    // Napoje
    { id: "item-44", categoryId: "cat-napoje", name: "AYRAN" },
    { id: "item-45", categoryId: "cat-napoje", name: "MANGO DIMES" },
    { id: "item-46", categoryId: "cat-napoje", name: "PEPSI" },
    { id: "item-47", categoryId: "cat-napoje", name: "MIRINDA" },
    { id: "item-48", categoryId: "cat-napoje", name: "LIPTON" },
    { id: "item-49", categoryId: "cat-napoje", name: "MOUNTAIN DEW" },
    { id: "item-50", categoryId: "cat-napoje", name: "WODA" },
  ];

  const itemIds: Record<string, string> = {};
  for (const item of itemsData) {
    const i = await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        categoryId: categories[item.categoryId],
        name: item.name,
        description: item.description,
        active: true,
      },
    });
    itemIds[item.id] = i.id;
  }
  console.log(`  ✓ Created ${itemsData.length} items`);

  // Item Prices
  const itemPricesData: ItemPriceData[] = [
    // Rollo prices
    { itemId: "item-1", sizeId: "size-small", price: 17.0 },
    { itemId: "item-1", sizeId: "size-medium", price: 24.0 },
    { itemId: "item-1", sizeId: "size-large", price: 30.0 },
    { itemId: "item-2", sizeId: "size-small", price: 20.0 },
    { itemId: "item-2", sizeId: "size-medium", price: 26.0 },
    { itemId: "item-2", sizeId: "size-large", price: 32.0 },
    { itemId: "item-3", sizeId: "size-small", price: 19.0 },
    { itemId: "item-3", sizeId: "size-medium", price: 25.0 },
    { itemId: "item-3", sizeId: "size-large", price: 31.0 },
    { itemId: "item-4", sizeId: "size-small", price: 23.0 },
    { itemId: "item-4", sizeId: "size-medium", price: 30.0 },
    { itemId: "item-4", sizeId: "size-large", price: 36.0 },
    { itemId: "item-5", sizeId: "size-small", price: 23.0 },
    { itemId: "item-5", sizeId: "size-medium", price: 30.0 },
    { itemId: "item-6", sizeId: "size-small", price: 23.0 },
    { itemId: "item-6", sizeId: "size-medium", price: 30.0 },
    { itemId: "item-7", sizeId: "size-small", price: 15.0 },
    { itemId: "item-7", sizeId: "size-medium", price: 20.0 },
    { itemId: "item-7", sizeId: "size-large", price: 25.0 },
    { itemId: "item-8", sizeId: "size-large", price: 43.0 },
    { itemId: "item-9", sizeId: "size-large", price: 43.0 },
    { itemId: "item-10", sizeId: "size-small", price: 22.0 },
    { itemId: "item-10", sizeId: "size-medium", price: 28.0 },
    { itemId: "item-11", sizeId: "size-small", price: 22.0 },
    { itemId: "item-11", sizeId: "size-medium", price: 28.0 },
    { itemId: "item-12", sizeId: "size-small", price: 22.0 },
    { itemId: "item-12", sizeId: "size-medium", price: 28.0 },
    // Tortilla prices
    { itemId: "item-13", sizeId: "size-small", price: 20.0 },
    { itemId: "item-13", sizeId: "size-medium", price: 26.0 },
    { itemId: "item-13", sizeId: "size-large", price: 33.0 },
    { itemId: "item-14", sizeId: "size-small", price: 21.0 },
    { itemId: "item-14", sizeId: "size-medium", price: 27.0 },
    { itemId: "item-14", sizeId: "size-large", price: 34.0 },
    { itemId: "item-15", sizeId: "size-small", price: 21.0 },
    { itemId: "item-15", sizeId: "size-medium", price: 27.0 },
    { itemId: "item-15", sizeId: "size-large", price: 34.0 },
    { itemId: "item-16", sizeId: "size-small", price: 25.0 },
    { itemId: "item-16", sizeId: "size-medium", price: 30.0 },
    { itemId: "item-16", sizeId: "size-large", price: 37.0 },
    // Talerz prices
    { itemId: "item-17", sizeId: null, price: 29.0 },
    { itemId: "item-18", sizeId: null, price: 35.0 },
    { itemId: "item-19", sizeId: null, price: 43.0 },
    { itemId: "item-20", sizeId: null, price: 34.0 },
    { itemId: "item-21", sizeId: null, price: 22.0 },
    // Box prices
    { itemId: "item-22", sizeId: "size-small", price: 21.0 },
    { itemId: "item-22", sizeId: "size-large", price: 27.0 },
    { itemId: "item-23", sizeId: "size-small", price: 24.0 },
    { itemId: "item-23", sizeId: "size-large", price: 30.0 },
    { itemId: "item-24", sizeId: "size-small", price: 19.0 },
    // Bułka prices
    { itemId: "item-25", sizeId: "size-small", price: 22.0 },
    { itemId: "item-25", sizeId: "size-medium", price: 27.0 },
    { itemId: "item-25", sizeId: "size-large", price: 34.0 },
    { itemId: "item-26", sizeId: "size-small", price: 24.0 },
    { itemId: "item-26", sizeId: "size-medium", price: 30.0 },
    { itemId: "item-26", sizeId: "size-large", price: 37.0 },
    { itemId: "item-27", sizeId: "size-small", price: 27.0 },
    { itemId: "item-27", sizeId: "size-medium", price: 32.0 },
    { itemId: "item-27", sizeId: "size-large", price: 39.0 },
    { itemId: "item-28", sizeId: "size-small", price: 28.0 },
    { itemId: "item-28", sizeId: "size-medium", price: 36.0 },
    // Kapsalon prices
    { itemId: "item-29", sizeId: null, price: 31.0 },
    // Kurczak prices
    { itemId: "item-30", sizeId: null, price: 26.0 },
    { itemId: "item-31", sizeId: null, price: 24.0 },
    { itemId: "item-32", sizeId: null, price: 21.0 },
    // Sałatki prices
    { itemId: "item-33", sizeId: null, price: 24.0 },
    { itemId: "item-34", sizeId: null, price: 22.0 },
    { itemId: "item-35", sizeId: null, price: 16.0 },
    // Dodatki prices
    { itemId: "item-36", sizeId: "size-small", price: 9.0 },
    { itemId: "item-36", sizeId: "size-large", price: 17.0 },
    { itemId: "item-37", sizeId: "size-small", price: 12.0 },
    { itemId: "item-37", sizeId: "size-large", price: 19.0 },
    { itemId: "item-38", sizeId: null, price: 7.0 },
    { itemId: "item-39", sizeId: null, price: 8.0 },
    { itemId: "item-40", sizeId: null, price: 3.0 },
    { itemId: "item-41", sizeId: null, price: 3.0 },
    { itemId: "item-42", sizeId: null, price: 3.0 },
    { itemId: "item-43", sizeId: null, price: 16.0 },
    // Napoje prices
    { itemId: "item-44", sizeId: null, price: 6.0 },
    { itemId: "item-45", sizeId: "size-033l", price: 7.0 },
    { itemId: "item-46", sizeId: "size-033l", price: 7.0 },
    { itemId: "item-46", sizeId: "size-05l", price: 9.0 },
    { itemId: "item-47", sizeId: "size-033l", price: 7.0 },
    { itemId: "item-47", sizeId: "size-05l", price: 9.0 },
    { itemId: "item-48", sizeId: "size-033l", price: 7.0 },
    { itemId: "item-48", sizeId: "size-05l", price: 9.0 },
    { itemId: "item-49", sizeId: "size-033l", price: 7.0 },
    { itemId: "item-49", sizeId: "size-05l", price: 9.0 },
    { itemId: "item-50", sizeId: "size-05l", price: 5.0 },
  ];

  let priceCount = 0;
  for (const price of itemPricesData) {
    const foundItem = await prisma.item.findUnique({
      where: { id: price.itemId },
    });

    if (foundItem) {
      await prisma.itemPrice.upsert({
        where: {
          id: `${price.itemId}-${price.sizeId || "no-size"}-${branch.id}`,
        },
        update: {},
        create: {
          id: `${price.itemId}-${price.sizeId || "no-size"}-${branch.id}`,
          itemId: foundItem.id,
          branchId: branch.id,
          price: price.price,
          validFrom: new Date(),
          validTo: null,
        },
      });
      priceCount++;
    }
  }
  console.log(`  ✓ Created ${priceCount} item prices`);

  // ============================================================================
  // SAMPLE ORDER (Optional - for testing)
  // ============================================================================
  console.log("📦 Creating sample order...");

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      branchId: branch.id,
      orderType: "DELIVERY",
      status: "NEW",
      totalPrice: 85.5,
      deliveryFee: 5.0,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      street: address.street,
      buildingNumber: address.buildingNumber,
      apartmentNumber: address.apartmentNumber,
      floor: address.floor,
      city: address.city,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
      accessNotes: address.accessNotes,
    },
  });
  console.log(`  ✓ Created sample order: ${order.id}`);

  // Add items to order
  const orderItem1 = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      itemName: "ROLLO DELTA KEBAB",
      sizeName: "Średnie",
      quantity: 2,
      unitPrice: 24.0,
      notes: "Extra sauce",
    },
  });

  const orderItem2 = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      itemName: "FRYTKI",
      sizeName: "Duże",
      quantity: 1,
      unitPrice: 17.0,
      notes: "",
    },
  });

  // Add status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: "NEW",
      changedByUserId: admin.id,
      changedByRole: "SUPER_ADMIN",
      reason: "Order created from seed script",
    },
  });

  console.log(`  ✓ Added order items and status history`);

  // ============================================================================
  // COMPLETION
  // ============================================================================
  console.log("\n✅ Database seed completed successfully!");
  console.log("\n📊 Seed Summary:");
  console.log(`   - Roles: ${roleNames.length}`);
  console.log(`   - Users: 4 (admin, kitchen, driver, customer)`);
  console.log(`   - Restaurant & Branch: 1 each`);
  console.log(`   - Categories: ${categoryData.length}`);
  console.log(`   - Items: ${itemsData.length}`);
  console.log(`   - Sizes: ${sizeData.length}`);
  console.log(`   - Item Prices: ${priceCount}`);
  console.log(`   - Sample Order: 1`);

  console.log("\n🔐 Test Credentials:");
  console.log(`   Admin: admin@delta.local / admin123`);
  console.log(`   Kitchen: kitchen@delta.local / kitchen123`);
  console.log(`   Driver: driver@delta.local / driver123`);
  console.log(`   Customer: customer@delta.local / customer123`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

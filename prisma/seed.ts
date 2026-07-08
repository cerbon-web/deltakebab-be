import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const selectedEnvFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), selectedEnvFile) });

const ensureDatabaseUrl = (): void => {
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || "3306";
    const user = encodeURIComponent(process.env.DB_USER);
    const password = encodeURIComponent(process.env.DB_PASSWORD || "");
    const database = encodeURIComponent(process.env.DB_NAME);
    process.env.DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${database}`;
    return;
  }

  if (!process.env.DATABASE_URL) {
    return;
  }
};

ensureDatabaseUrl();

const prisma = new PrismaClient();

type MenuSeedItem = {
  name: string;
  description: string;
  prices: Record<string, number>;
};

type MenuSeedCategory = {
  category: string;
  items: MenuSeedItem[];
};

const menuSeedData: MenuSeedCategory[] = [
  {
    category: "ROLLO",
    items: [
      {
        name: "ROLLO DELTA KEBAB",
        description: "mięso, surówka, sosy",
        prices: { małe: 17, średnie: 24, mega: 30 },
      },
      {
        name: "ROLLO DELTA KEBAB Z SEREM",
        description: "mięso, ser, surówka, sosy",
        prices: { małe: 20, średnie: 26, mega: 32 },
      },
      {
        name: "DELTA AMERYKAŃSKIE",
        description: "mięso, frytki, sosy",
        prices: { małe: 19, średnie: 25, mega: 31 },
      },
      {
        name: "ROLLO DELTA SAMO MIĘSO",
        description: "mięso, sosy",
        prices: { małe: 23, średnie: 30, mega: 36 },
      },
      {
        name: "SUPER ROLLO DELTA",
        description: "mięso, ser, frytki, surówka, sosy",
        prices: { małe: 23, średnie: 30 },
      },
      {
        name: "SZPINAK ROLLO DELTA",
        description: "mięso, szpinak, ser, sosy",
        prices: { małe: 23, średnie: 30 },
      },
      {
        name: "ROLLO WEGE",
        description: "falafel, warzywa, sos",
        prices: { małe: 15, średnie: 20, mega: 25 },
      },
      {
        name: "SUPER MEGA ROLLO AMERYKAŃSKIE",
        description: "2x mięso, ser, frytki, sosy",
        prices: { mega: 43 },
      },
      {
        name: "SUPER MEGA ROLLO Z SEREM",
        description: "2x mięso, ser, surówka, sosy",
        prices: { mega: 43 },
      },
      {
        name: "ROLLO DELTA GREKO",
        description: "mięso, sałata lodowa, czerwona cebula, oliwki, ser sałatkowy, sos łagodny",
        prices: { małe: 22, średnie: 28 },
      },
      {
        name: "ROLLO DELTA HOT SPICY",
        description: "mięso, papryka mix, jalapeño, surówka, sos ostry",
        prices: { małe: 22, średnie: 28 },
      },
      {
        name: "ROLLO WRAP",
        description: "mięso, polędwiczki, sałata lodowa, pekińska, sosy",
        prices: { małe: 22, średnie: 28 },
      },
    ],
  },
  {
    category: "TORTILLA",
    items: [
      {
        name: "TORTILLA DELTA",
        description: "mięso, surówka, ogórek, sosy",
        prices: { małe: 20, średnie: 26, mega: 33 },
      },
      {
        name: "TORTILLA DELTA Z SEREM",
        description: "mięso, ser, surówka, ogórek, sosy",
        prices: { małe: 21, średnie: 27, mega: 34 },
      },
      {
        name: "TORTILLA AMERYKAŃSKA",
        description: "mięso, frytki, sosy",
        prices: { małe: 21, średnie: 27, mega: 34 },
      },
      {
        name: "TORTILLA SAMO MIĘSO",
        description: "mięso, sosy",
        prices: { małe: 25, średnie: 30, mega: 37 },
      },
    ],
  },
  {
    category: "TALERZ",
    items: [
      {
        name: "TALERZ KEBAB",
        description: "mięso, warzywa, frytki, sosy",
        prices: { standard: 29 },
      },
      {
        name: "SUPER TALERZ",
        description: "mięso, warzywa, ser, frytki, sosy",
        prices: { standard: 35 },
      },
      {
        name: "MEGA TALERZ",
        description: "2x mięso, warzywa, sosy + osobne frytki",
        prices: { standard: 43 },
      },
      {
        name: "TALERZ SAMO MIĘSO",
        description: "mięso, frytki, sosy",
        prices: { standard: 34 },
      },
      {
        name: "TALERZ FALAFEL",
        description: "falafele, warzywa, frytki, sosy",
        prices: { standard: 22 },
      },
    ],
  },
  {
    category: "BOX",
    items: [
      {
        name: "KEBAB BOX",
        description: "mięso, warzywa, frytki, sosy",
        prices: { mały: 21, duży: 27 },
      },
      {
        name: "BOX AMERYKAŃSKI",
        description: "mięso, frytki, sosy",
        prices: { mały: 24, duży: 30 },
      },
      {
        name: "KIDS BOX",
        description: "chicken nuggets 2 szt., chicken pops 4 szt., kulki warzywne 3 szt., frytki 80g, sos i napój",
        prices: { mały: 19 },
      },
    ],
  },
  {
    category: "BUŁKA",
    items: [
      {
        name: "KEBAB W BUŁCE",
        description: "bułka, mięso, warzywa, sosy",
        prices: { mała: 22, średnia: 27, duża: 34 },
      },
      {
        name: "AMERYKAŃSKA",
        description: "bułka, mięso, frytki, sosy",
        prices: { mała: 24, średnia: 30, duża: 37 },
      },
      {
        name: "SUPER DELTA W BUŁCE",
        description: "bułka, mięso, warzywa, ser, frytki, sosy",
        prices: { mała: 27, średnia: 32, duża: 39 },
      },
      {
        name: "BUŁKA SAMO MIĘSO",
        description: "bułka, mięso, sosy",
        prices: { mała: 28, średnia: 36 },
      },
    ],
  },
  {
    category: "KAPSALON",
    items: [
      {
        name: "KAPSALON",
        description: "mięso, warzywa, pomidor, ogórek, frytki, ser, sos",
        prices: { standard: 31 },
      },
    ],
  },
  {
    category: "KURCZAK",
    items: [
      {
        name: "DELTOPYCHA",
        description: "polędwiczki z kurczaka 2 szt., popsy z kurczaka 10 szt., frytki, sos",
        prices: { standard: 26 },
      },
      {
        name: "CHICKEN STRIPS",
        description: "polędwiczki z kurczaka 4 szt., frytki, sos",
        prices: { standard: 24 },
      },
      {
        name: "CHICKEN POPS",
        description: "kawałki kurczaka w panierce ryżowej 10 szt., frytki, sos",
        prices: { standard: 21 },
      },
    ],
  },
  {
    category: "DODATKI",
    items: [
      {
        name: "FRYTKI",
        description: "",
        prices: { małe: 9, duże: 17 },
      },
      {
        name: "FRYTKI Z SEREM",
        description: "",
        prices: { małe: 12, duże: 19 },
      },
      {
        name: "BAKLAWA",
        description: "",
        prices: { standard: 7 },
      },
      {
        name: "DODATKOWE MIĘSO",
        description: "",
        prices: { standard: 8 },
      },
      {
        name: "DODATKOWE WARZYWA",
        description: "",
        prices: { standard: 3 },
      },
      {
        name: "DODATKOWY SER",
        description: "",
        prices: { standard: 3 },
      },
      {
        name: "DODATKOWY SOS",
        description: "czosnkowy, łagodny, ketchup, ostry, BBQ, koperkowy",
        prices: { standard: 3 },
      },
      {
        name: "KULKI WARZYWNE",
        description: "kulki warzywne 10 szt., frytki, sos",
        prices: { standard: 16 },
      },
    ],
  },
  {
    category: "SAŁATKI",
    items: [
      {
        name: "SAŁATKA Z KEBABEM",
        description: "mięso, warzywa, sosy",
        prices: { standard: 24 },
      },
      {
        name: "CRISPY SALAD",
        description: "stripsy z kurczaka 3 szt., warzywa, sosy",
        prices: { standard: 22 },
      },
      {
        name: "GRECKA",
        description: "sałata lodowa, ogórek, pomidor, feta, oliwki, jalapeño, sosy",
        prices: { standard: 16 },
      },
    ],
  },
  {
    category: "NAPOJE",
    items: [
      {
        name: "AYRAN",
        description: "",
        prices: { standard: 6 },
      },
      {
        name: "MANGO DIMES",
        description: "0,33L",
        prices: { standard: 7 },
      },
      {
        name: "PEPSI",
        description: "",
        prices: { "0,33L": 7, "0,5L": 9 },
      },
      {
        name: "MIRINDA",
        description: "",
        prices: { "0,33L": 7, "0,5L": 9 },
      },
      {
        name: "LIPTON",
        description: "",
        prices: { "0,33L": 7, "0,5L": 9 },
      },
      {
        name: "MOUNTAIN DEW",
        description: "",
        prices: { "0,33L": 7, "0,5L": 9 },
      },
      {
        name: "WODA",
        description: "0,5L",
        prices: { standard: 5 },
      },
      {
        name: "OPAKOWANIE NA WYNOS",
        description: "",
        prices: { standard: 1.5 },
      },
      {
        name: "REKLAMÓWKA",
        description: "",
        prices: { standard: 1 },
      },
    ],
  },
];

async function shouldSeedDatabase(): Promise<boolean> {
  const branchMenuCount = await prisma.branchMenu.count();
  return branchMenuCount === 0;
}

async function ensureBranchMenuSeed(branchId: string, branchName: string) {
  const existingBranchMenu = await prisma.branchMenu.findFirst({
    where: { branchId, name: "Main Menu" },
  });

  const sizeGroupName = "Default";

  const branchMenu = existingBranchMenu
    ? await prisma.branchMenu.update({
        where: { id: existingBranchMenu.id },
        data: { active: true, name: "Main Menu" },
      })
    : await prisma.branchMenu.create({
        data: {
          branchId,
          name: "Main Menu",
          active: true,
        },
      });

  let sizeGroup = await prisma.sizeGroup.findFirst({ where: { name: sizeGroupName } });
  if (!sizeGroup) {
    sizeGroup = await prisma.sizeGroup.create({
      data: {
        name: sizeGroupName,
        unit: "pcs",
        active: true,
      },
    });
  }

  for (const [categoryIndex, categorySeed] of menuSeedData.entries()) {
    let category = await prisma.category.findFirst({
      where: { menuId: branchMenu.id, name: categorySeed.category },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          menuId: branchMenu.id,
          name: categorySeed.category,
          icon: "restaurant",
          displayOrder: categoryIndex,
          active: true,
        },
      });
    } else {
      await prisma.category.update({
        where: { id: category.id },
        data: {
          displayOrder: categoryIndex,
          active: true,
        },
      });
    }

    for (const [itemIndex, itemSeed] of categorySeed.items.entries()) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { categoryId: category.id, name: itemSeed.name },
      });

      if (!menuItem) {
        menuItem = await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: itemSeed.name,
            description: itemSeed.description ?? null,
            displayOrder: itemIndex,
            active: true,
          },
        });
      } else {
        await prisma.menuItem.update({
          where: { id: menuItem.id },
          data: {
            description: itemSeed.description ?? null,
            displayOrder: itemIndex,
            active: true,
          },
        });
      }

      let itemSizeGroup = await prisma.itemSizeGroup.findFirst({
        where: { menuItemId: menuItem.id, sizeGroupId: sizeGroup.id },
      });

      if (!itemSizeGroup) {
        itemSizeGroup = await prisma.itemSizeGroup.create({
          data: {
            menuItemId: menuItem.id,
            sizeGroupId: sizeGroup.id,
            displayOrder: 0,
            active: true,
          },
        });
      } else {
        await prisma.itemSizeGroup.update({
          where: { id: itemSizeGroup.id },
          data: {
            displayOrder: 0,
            active: true,
          },
        });
      }

      let branchMenuItem = await prisma.branchMenuItem.findFirst({
        where: { branchMenuId: branchMenu.id, menuItemId: menuItem.id },
      });

      if (!branchMenuItem) {
        branchMenuItem = await prisma.branchMenuItem.create({
          data: {
            branchMenuId: branchMenu.id,
            menuItemId: menuItem.id,
            available: true,
            nameOverride: itemSeed.name,
            descriptionOverride: itemSeed.description ?? null,
          },
        });
      } else {
        await prisma.branchMenuItem.update({
          where: { id: branchMenuItem.id },
          data: {
            available: true,
            nameOverride: itemSeed.name,
            descriptionOverride: itemSeed.description ?? null,
          },
        });
      }

      const existingSizes = await prisma.branchMenuItemSize.findMany({
        where: { branchMenuItemId: branchMenuItem.id },
      });

      for (const existingSize of existingSizes) {
        await prisma.branchMenuItemSize.delete({ where: { id: existingSize.id } });
      }

      const priceEntries = Object.entries(itemSeed.prices ?? {});
      for (const [sizeIndex, [sizeName, sizePrice]] of priceEntries.entries()) {
        let sizeOption = await prisma.sizeOption.findFirst({
          where: { sizeGroupId: sizeGroup.id, name: sizeName },
        });

        if (!sizeOption) {
          sizeOption = await prisma.sizeOption.create({
            data: {
              sizeGroupId: sizeGroup.id,
              name: sizeName,
              value: sizeName,
              displayOrder: sizeIndex,
              active: true,
            },
          });
        } else {
          await prisma.sizeOption.update({
            where: { id: sizeOption.id },
            data: {
              value: sizeName,
              displayOrder: sizeIndex,
              active: true,
            },
          });
        }

        await prisma.branchMenuItemSize.create({
          data: {
            branchMenuItemId: branchMenuItem.id,
            sizeOptionId: sizeOption.id,
            price: Number(sizePrice),
            available: true,
          },
        });
      }
    }
  }

  console.log(`  ✓ Seeded branch menu for ${branchName}`);
}

async function main() {
  const shouldSeed = await shouldSeedDatabase();

  if (!shouldSeed) {
    console.log("ℹ️ Database already contains seed data. Updating existing seed records.");
  } else {
    console.log("🌱 Applying database seed...");
  }

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

  const createdBranches = [{ id: branch.id, name: branch.name }];
  for (const seededBranch of branchSeedData) {
    createdBranches.push({ id: seededBranch.id, name: seededBranch.name });
  }

  for (const branchSeed of createdBranches) {
    await ensureBranchMenuSeed(branchSeed.id, branchSeed.name);
  }

  // ============================================================================
  // RESTAURANT CONFIGURATION
  // ============================================================================
  console.log("⚙️  Creating restaurant configuration...");

  const info = await prisma.restaurantInfo.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      packagingFee: 1.5,
      plasticBagFee: 1.0,
    },
  });
  console.log("  ✓ Created restaurant info");

  const hours = [
    { dayOfWeek: 0, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 1, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 2, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 3, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 4, openTime: "10:00", closeTime: "02:00" },
    { dayOfWeek: 5, openTime: "10:00", closeTime: "02:00" },
    { dayOfWeek: 6, openTime: "10:00", closeTime: "24:00" },
  ];

  for (const branchSeed of createdBranches) {
    for (const hour of hours) {
      await prisma.branchHours.upsert({
        where: { branchId_dayOfWeek: { branchId: branchSeed.id, dayOfWeek: hour.dayOfWeek } },
        update: { openTime: hour.openTime, closeTime: hour.closeTime },
        create: {
          branchId: branchSeed.id,
          ...hour,
        },
      });
    }

    await prisma.branchDeliveryRule.upsert({
      where: { branchId: branchSeed.id },
      update: {},
      create: {
        branchId: branchSeed.id,
        minimumOrderValue: 40.0,
        maximumDeliveryDistance: 20.0,
        baseDeliveryFee: 5.0,
        perKmFee: 2.0,
      },
    });
  }
  console.log("  ✓ Created branch hours and delivery rules");

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
  console.log("  ✓ Assigned kitchen staff to branch");

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
  console.log("  ✓ Created driver profile");

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
  console.log("  ✓ Created customer address");

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

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order.id,
        itemName: "ROLLO DELTA KEBAB",
        sizeName: "Średnie",
        quantity: 2,
        unitPrice: 24.0,
        notes: "Extra sauce",
      },
      {
        orderId: order.id,
        itemName: "FRYTKI",
        sizeName: "Duże",
        quantity: 1,
        unitPrice: 17.0,
        notes: "",
      },
    ],
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: "NEW",
      changedByUserId: admin.id,
      changedByRole: "SUPER_ADMIN",
      reason: "Order created from seed script",
    },
  });

  console.log("  ✓ Added order items and status history");

  // ============================================================================
  // COMPLETION
  // ============================================================================
  console.log("\n✅ Database seed completed successfully!");
  console.log("\n📊 Seed Summary:");
  console.log(`   - Roles: ${roleNames.length}`);
  console.log("   - Users: 4 (admin, kitchen, driver, customer)");
  console.log("   - Restaurant & Branch: 1 each");
  console.log("   - Branch menus: seeded from the embedded menu catalog");
  console.log("   - Sample Order: 1");

  console.log("\n🔐 Test Credentials:");
  console.log("   Admin: admin@delta.local / admin123");
  console.log("   Kitchen: kitchen@delta.local / kitchen123");
  console.log("   Driver: driver@delta.local / driver123");
  console.log("   Customer: customer@delta.local / customer123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

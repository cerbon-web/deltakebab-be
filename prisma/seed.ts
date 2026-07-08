import fs from "fs";
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

async function shouldSeedDatabase(): Promise<boolean> {
  const branchMenuCount = await prisma.branchMenu.count();
  return branchMenuCount === 0;
}

function loadMenuSeedData(): any {
  const candidates = [
    path.resolve(process.cwd(), "menu", "menu_response.json"),
    path.resolve(process.cwd(), "..", "menu", "menu_response.json"),
    path.resolve(__dirname, "..", "..", "menu", "menu_response.json"),
    path.resolve(__dirname, "..", "..", "..", "menu", "menu_response.json"),
    path.resolve("/menu", "menu_response.json"),
  ];

  const menuPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!menuPath) {
    throw new Error(`Could not find menu_response.json. Tried: ${candidates.join(", ")}`);
  }

  const raw = fs.readFileSync(menuPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

async function ensureBranchMenuSeed(branchId: string, branchName: string, menuSeedData: any) {
  const existingBranchMenu = await prisma.branchMenu.findFirst({
    where: { branchId, name: "Main Menu" },
  });

  const rolloCategoryNames = ["Rollo", "Rollo ", "Rollos"];
  const pepsiItemNames = ["PEPSI", "Pepsi"];
  const sizeGroupName = "Default";
  const sizeNames = ["Małe", "Średnie", "Duże"];
  const sizeValues = ["male", "srednie", "duze"];
  const sizePricesByItem: Record<string, string[]> = {
    PEPSI: ["4.50", "6.00", "8.50"],
    Pepsi: ["4.50", "6.00", "8.50"],
  };

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

  const sizeOptions: Array<{ id: string; name: string; value: string }> = [];
  for (const [index, sizeName] of sizeNames.entries()) {
    let sizeOption = await prisma.sizeOption.findFirst({
      where: { sizeGroupId: sizeGroup.id, name: sizeName },
    });

    if (!sizeOption) {
      sizeOption = await prisma.sizeOption.create({
        data: {
          sizeGroupId: sizeGroup.id,
          name: sizeName,
          value: sizeValues[index],
          displayOrder: index,
          active: true,
        },
      });
    } else {
      await prisma.sizeOption.update({
        where: { id: sizeOption.id },
        data: {
          value: sizeValues[index],
          displayOrder: index,
          active: true,
        },
      });
    }

    sizeOptions.push({ id: sizeOption.id, name: sizeOption.name, value: sizeOption.value ?? sizeValues[index] });
  }

  for (const [categoryIndex, categorySeed] of (menuSeedData.categories || []).entries()) {
    let category = await prisma.category.findFirst({
      where: { menuId: branchMenu.id, name: categorySeed.name },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          menuId: branchMenu.id,
          name: categorySeed.name,
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

    for (const [itemIndex, itemSeed] of (categorySeed.items || []).entries()) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { categoryId: category.id, name: itemSeed.name },
      });

      const fallbackPrice = 10 + itemIndex * 2;
      const itemPrice = Number(itemSeed.prices?.[0]?.price ?? fallbackPrice);

      if (!menuItem) {
        menuItem = await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: itemSeed.name,
            description: itemSeed.description ?? null,
            imageUrl: itemSeed.imageUrl ?? null,
            active: true,
          },
        });
      } else {
        await prisma.menuItem.update({
          where: { id: menuItem.id },
          data: {
            description: itemSeed.description ?? null,
            imageUrl: itemSeed.imageUrl ?? null,
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

      const shouldAssignSizes = rolloCategoryNames.includes(categorySeed.name) || pepsiItemNames.includes(itemSeed.name);

      if (shouldAssignSizes) {
        const priceOverrides = sizePricesByItem[itemSeed.name] ?? [String(itemPrice), String(itemPrice + 2), String(itemPrice + 4)];

        for (const [index, sizeOption] of sizeOptions.entries()) {
          const sizePrice = Number(priceOverrides[index] ?? itemPrice);
          let branchMenuItemSize = await prisma.branchMenuItemSize.findFirst({
            where: { branchMenuItemId: branchMenuItem.id, sizeOptionId: sizeOption.id },
          });

          if (!branchMenuItemSize) {
            await prisma.branchMenuItemSize.create({
              data: {
                branchMenuItemId: branchMenuItem.id,
                sizeOptionId: sizeOption.id,
                price: sizePrice,
                available: true,
              },
            });
          } else {
            await prisma.branchMenuItemSize.update({
              where: { id: branchMenuItemSize.id },
              data: {
                price: sizePrice,
                available: true,
              },
            });
          }
        }
      } else {
        let branchMenuItemSize = await prisma.branchMenuItemSize.findFirst({
          where: { branchMenuItemId: branchMenuItem.id, sizeOptionId: sizeOptions[0]?.id },
        });

        if (branchMenuItemSize) {
          await prisma.branchMenuItemSize.delete({ where: { id: branchMenuItemSize.id } });
        }

        let defaultSize = await prisma.branchMenuItemSize.findFirst({
          where: { branchMenuItemId: branchMenuItem.id, sizeOptionId: sizeOptions[0]?.id },
        });

        if (!defaultSize) {
          await prisma.branchMenuItemSize.create({
            data: {
              branchMenuItemId: branchMenuItem.id,
              sizeOptionId: sizeOptions[0]?.id,
              price: itemPrice,
              available: true,
            },
          });
        }
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

  const menuSeedData = loadMenuSeedData();
  for (const branchSeed of createdBranches) {
    await ensureBranchMenuSeed(branchSeed.id, branchSeed.name, menuSeedData);
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
  console.log("   - Branch menus: seeded from the local menu JSON");
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

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `authProvider` VARCHAR(191) NOT NULL DEFAULT 'NATIVE',
    `providerId` VARCHAR(191) NULL,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserRole_userId_idx`(`userId`),
    INDEX `UserRole_roleId_idx`(`roleId`),
    UNIQUE INDEX `UserRole_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Restaurant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Restaurant_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `buildingNumber` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Branch_restaurantId_idx`(`restaurantId`),
    INDEX `Branch_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RestaurantStaff` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RestaurantStaff_userId_idx`(`userId`),
    INDEX `RestaurantStaff_branchId_idx`(`branchId`),
    UNIQUE INDEX `RestaurantStaff_userId_branchId_key`(`userId`, `branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RestaurantInfo` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `packagingFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `plasticBagFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RestaurantInfo_restaurantId_key`(`restaurantId`),
    INDEX `RestaurantInfo_restaurantId_idx`(`restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RestaurantHours` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `dayRange` INTEGER NOT NULL,
    `openTime` VARCHAR(191) NOT NULL,
    `closeTime` VARCHAR(191) NOT NULL,

    INDEX `RestaurantHours_restaurantId_idx`(`restaurantId`),
    UNIQUE INDEX `RestaurantHours_restaurantId_dayRange_key`(`restaurantId`, `dayRange`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RestaurantDeliveryRules` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `minOrderValue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `minDeliveryDistance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `maxDeliveryDistance` DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
    `baseFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `perKmFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    UNIQUE INDEX `RestaurantDeliveryRules_restaurantId_key`(`restaurantId`),
    INDEX `RestaurantDeliveryRules_restaurantId_idx`(`restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    INDEX `Category_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Item_categoryId_idx`(`categoryId`),
    INDEX `Item_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Size` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Size_name_key`(`name`),
    INDEX `Size_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemPrice` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validTo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemPrice_itemId_idx`(`itemId`),
    INDEX `ItemPrice_branchId_idx`(`branchId`),
    INDEX `ItemPrice_validFrom_idx`(`validFrom`),
    INDEX `ItemPrice_validTo_idx`(`validTo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RestaurantItemOverride` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `specialPrice` DECIMAL(10, 2) NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `RestaurantItemOverride_restaurantId_idx`(`restaurantId`),
    INDEX `RestaurantItemOverride_itemId_idx`(`itemId`),
    UNIQUE INDEX `RestaurantItemOverride_restaurantId_itemId_key`(`restaurantId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerAddress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `street` VARCHAR(191) NOT NULL,
    `buildingNumber` VARCHAR(191) NOT NULL,
    `apartmentNumber` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `accessNotes` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CustomerAddress_userId_idx`(`userId`),
    INDEX `CustomerAddress_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `orderType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `totalPrice` DECIMAL(10, 2) NOT NULL,
    `deliveryFee` DECIMAL(10, 2) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NULL,
    `buildingNumber` VARCHAR(191) NULL,
    `apartmentNumber` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `accessNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Order_customerId_idx`(`customerId`),
    INDEX `Order_branchId_idx`(`branchId`),
    INDEX `Order_status_idx`(`status`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(191) NOT NULL,
    `sizeName` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderItem_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `changedByUserId` VARCHAR(191) NULL,
    `changedByRole` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderStatusHistory_orderId_idx`(`orderId`),
    INDEX `OrderStatusHistory_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderEvent` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderEvent_orderId_idx`(`orderId`),
    INDEX `OrderEvent_eventType_idx`(`eventType`),
    INDEX `OrderEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriverProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `vehicleInfo` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DriverProfile_userId_key`(`userId`),
    INDEX `DriverProfile_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriverAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `driverId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pickedUpAt` DATETIME(3) NULL,
    `deliveryStartedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `DriverAssignment_orderId_key`(`orderId`),
    INDEX `DriverAssignment_driverId_idx`(`driverId`),
    INDEX `DriverAssignment_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Chat_orderId_key`(`orderId`),
    INDEX `Chat_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `chatId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_chatId_idx`(`chatId`),
    INDEX `Message_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10, 2) NOT NULL,
    `provider` VARCHAR(191) NULL,
    `providerTransactionId` VARCHAR(191) NULL,
    `failedRetries` INTEGER NOT NULL DEFAULT 0,
    `nextRetryAt` DATETIME(3) NULL,
    `webhookData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_orderId_key`(`orderId`),
    INDEX `Payment_orderId_idx`(`orderId`),
    INDEX `Payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantStaff` ADD CONSTRAINT `RestaurantStaff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantStaff` ADD CONSTRAINT `RestaurantStaff_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantInfo` ADD CONSTRAINT `RestaurantInfo_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantHours` ADD CONSTRAINT `RestaurantHours_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantDeliveryRules` ADD CONSTRAINT `RestaurantDeliveryRules_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemPrice` ADD CONSTRAINT `ItemPrice_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemPrice` ADD CONSTRAINT `ItemPrice_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantItemOverride` ADD CONSTRAINT `RestaurantItemOverride_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantItemOverride` ADD CONSTRAINT `RestaurantItemOverride_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerAddress` ADD CONSTRAINT `CustomerAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_changedByUserId_fkey` FOREIGN KEY (`changedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderEvent` ADD CONSTRAINT `OrderEvent_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderEvent` ADD CONSTRAINT `OrderEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriverProfile` ADD CONSTRAINT `DriverProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriverAssignment` ADD CONSTRAINT `DriverAssignment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriverAssignment` ADD CONSTRAINT `DriverAssignment_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `DriverProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

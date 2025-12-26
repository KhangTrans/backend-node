-- AlterTable
ALTER TABLE `orders` ADD COLUMN `voucherId` INTEGER NULL;

-- CreateTable
CREATE TABLE `vouchers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `type` ENUM('DISCOUNT', 'FREE_SHIP') NOT NULL,
    `description` TEXT NULL,
    `discountPercent` INTEGER NULL,
    `maxDiscount` DECIMAL(15, 2) NULL,
    `minOrderAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `usageLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `userId` INTEGER NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vouchers_code_key`(`code`),
    INDEX `vouchers_code_idx`(`code`),
    INDEX `vouchers_type_idx`(`type`),
    INDEX `vouchers_userId_idx`(`userId`),
    INDEX `vouchers_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `orders_voucherId_idx` ON `orders`(`voucherId`);

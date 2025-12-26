/*
  Warnings:

  - You are about to alter the column `price` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(15,2)`.
  - You are about to alter the column `subtotal` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(15,2)`.
  - You are about to alter the column `subtotal` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(15,2)`.
  - You are about to alter the column `shippingFee` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(15,2)`.
  - You are about to alter the column `discount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(15,2)`.
  - You are about to alter the column `total` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE `order_items` MODIFY `price` DECIMAL(15, 2) NOT NULL,
    MODIFY `subtotal` DECIMAL(15, 2) NOT NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `subtotal` DECIMAL(15, 2) NOT NULL,
    MODIFY `shippingFee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    MODIFY `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    MODIFY `total` DECIMAL(15, 2) NOT NULL;

/*
  Warnings:

  - You are about to drop the `verification_url` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `verification_url` DROP FOREIGN KEY `verification_url_FK`;

-- DropTable
DROP TABLE `verification_url`;

-- CreateTable
CREATE TABLE `verification_code` (
    `uuid` BINARY(16) NOT NULL,
    `user_uuid` BINARY(16) NULL,
    `code` VARCHAR(6) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expires_at` DATETIME(0) NOT NULL DEFAULT (current_timestamp() + interval 6 minute),
    `valid` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gender` (
    `id` INTEGER NOT NULL,
    `gender` VARCHAR(16) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `uuid` BINARY(16) NOT NULL,
    `firstname` VARCHAR(48) NOT NULL,
    `lastname` VARCHAR(48) NOT NULL,
    `birth_date` DATE NOT NULL,
    `gender` INTEGER NOT NULL,
    `username` VARCHAR(16) NOT NULL,
    `password_hash` VARCHAR(60) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `email` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_gender_FK`(`gender`),
    INDEX `user_verified_IDX`(`verified`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_verification` (
    `uuid` BINARY(16) NOT NULL,
    `user_uuid` BINARY(16) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expires_at` DATETIME(0) NOT NULL DEFAULT (current_timestamp() + interval 6 minute),
    `valid` BOOLEAN NOT NULL DEFAULT true,
    `attempts_left` TINYINT NOT NULL DEFAULT 5,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_gender_FK` FOREIGN KEY (`gender`) REFERENCES `gender`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

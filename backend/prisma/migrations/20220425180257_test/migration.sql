-- CreateTable
CREATE TABLE `gender` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gender` VARCHAR(16) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `uuid` BINARY(16) NOT NULL,
    `firstname` VARCHAR(48) NOT NULL,
    `lastname` VARCHAR(48) NOT NULL,
    `birth_date` DATETIME(0) NOT NULL,
    `gender` INTEGER NOT NULL,
    `username` VARCHAR(16) NOT NULL,
    `password_hash` VARCHAR(60) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,

    INDEX `user_gender_FK`(`gender`),
    INDEX `user_verified_IDX`(`verified`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_url` (
    `user_uuid` BINARY(16) NOT NULL,
    `url` VARCHAR(128) NOT NULL,
    `user_email` VARCHAR(255) NOT NULL,
    `activation_complete` BOOLEAN NOT NULL DEFAULT false,

    INDEX `verification_url_FK`(`user_uuid`),
    PRIMARY KEY (`url`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_gender_FK` FOREIGN KEY (`gender`) REFERENCES `gender`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `verification_url` ADD CONSTRAINT `verification_url_FK` FOREIGN KEY (`user_uuid`) REFERENCES `user`(`uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

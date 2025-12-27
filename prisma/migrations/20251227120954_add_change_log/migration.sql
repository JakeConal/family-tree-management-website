-- CreateTable
CREATE TABLE `ChangeLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `familyTreeId` INTEGER NOT NULL,
    `oldValues` TEXT NULL,
    `newValues` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChangeLog_familyTreeId_fkey`(`familyTreeId`),
    INDEX `ChangeLog_entityType_entityId_fkey`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChangeLog` ADD CONSTRAINT `ChangeLog_familyTreeId_fkey` FOREIGN KEY (`familyTreeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

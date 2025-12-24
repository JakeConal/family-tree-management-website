-- CreateTable
CREATE TABLE `TreeOwner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(225) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `userId` VARCHAR(191) NULL,

    UNIQUE INDEX `TreeOwner_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FamilyTree` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `familyName` VARCHAR(225) NOT NULL,
    `origin` VARCHAR(500) NULL,
    `establishYear` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `treeOwnerId` INTEGER NOT NULL,
    `rootMemberId` INTEGER NULL,

    UNIQUE INDEX `FamilyTree_rootMemberId_key`(`rootMemberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FamilyMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(225) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `birthday` DATETIME(3) NULL,
    `address` VARCHAR(1000) NULL,
    `profilePicture` VARCHAR(500) NULL,
    `generation` VARCHAR(45) NULL,
    `isRootPerson` BOOLEAN NULL DEFAULT false,
    `isAdopted` BOOLEAN NULL DEFAULT false,
    `familyTreeId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Occupation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobTitle` VARCHAR(225) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `familyMemberId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Achievement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(225) NOT NULL,
    `achieveDate` DATETIME(3) NULL,
    `description` VARCHAR(2000) NULL,
    `familyMemberId` INTEGER NOT NULL,
    `achievementTypeId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AchievementType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `typeName` VARCHAR(225) NOT NULL,
    `familyTreeId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PassingRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dateOfPassing` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `familyMemberId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CauseOfDeath` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `causeName` VARCHAR(225) NOT NULL,
    `passingRecordId` INTEGER NOT NULL,
    `familyMemberId` INTEGER NOT NULL,

    UNIQUE INDEX `CauseOfDeath_passingRecordId_key`(`passingRecordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BuriedPlace` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `location` VARCHAR(1000) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `passingRecordId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaceOfOrigin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `location` VARCHAR(225) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FamilyMember_has_PlaceOfOrigin` (
    `familyMemberId` INTEGER NOT NULL,
    `placeOfOriginId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,

    PRIMARY KEY (`familyMemberId`, `placeOfOriginId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpouseRelationship` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `marriageDate` DATETIME(3) NOT NULL,
    `divorceDate` DATETIME(3) NULL,
    `familyMember1Id` INTEGER NOT NULL,
    `familyMember2Id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestEditor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accessCode` VARCHAR(45) NOT NULL,
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `familyMemberId` INTEGER NOT NULL,
    `familyTreeId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `email_verified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `provider_account_id` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `accounts_provider_provider_account_id_key`(`provider`, `provider_account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `session_token` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_session_token_key`(`session_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TreeOwner` ADD CONSTRAINT `TreeOwner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FamilyTree` ADD CONSTRAINT `FamilyTree_treeOwnerId_fkey` FOREIGN KEY (`treeOwnerId`) REFERENCES `TreeOwner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FamilyTree` ADD CONSTRAINT `FamilyTree_rootMemberId_fkey` FOREIGN KEY (`rootMemberId`) REFERENCES `FamilyMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FamilyMember` ADD CONSTRAINT `FamilyMember_familyTreeId_fkey` FOREIGN KEY (`familyTreeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FamilyMember` ADD CONSTRAINT `FamilyMember_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `FamilyMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Occupation` ADD CONSTRAINT `Occupation_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Achievement` ADD CONSTRAINT `Achievement_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Achievement` ADD CONSTRAINT `Achievement_achievementTypeId_fkey` FOREIGN KEY (`achievementTypeId`) REFERENCES `AchievementType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AchievementType` ADD CONSTRAINT `AchievementType_familyTreeId_fkey` FOREIGN KEY (`familyTreeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PassingRecord` ADD CONSTRAINT `PassingRecord_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CauseOfDeath` ADD CONSTRAINT `CauseOfDeath_passingRecordId_fkey` FOREIGN KEY (`passingRecordId`) REFERENCES `PassingRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CauseOfDeath` ADD CONSTRAINT `CauseOfDeath_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BuriedPlace` ADD CONSTRAINT `BuriedPlace_passingRecordId_fkey` FOREIGN KEY (`passingRecordId`) REFERENCES `PassingRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FamilyMember_has_PlaceOfOrigin` ADD CONSTRAINT `FamilyMember_has_PlaceOfOrigin_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FamilyMember_has_PlaceOfOrigin` ADD CONSTRAINT `FamilyMember_has_PlaceOfOrigin_placeOfOriginId_fkey` FOREIGN KEY (`placeOfOriginId`) REFERENCES `PlaceOfOrigin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpouseRelationship` ADD CONSTRAINT `SpouseRelationship_familyMember1Id_fkey` FOREIGN KEY (`familyMember1Id`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpouseRelationship` ADD CONSTRAINT `SpouseRelationship_familyMember2Id_fkey` FOREIGN KEY (`familyMember2Id`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestEditor` ADD CONSTRAINT `GuestEditor_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestEditor` ADD CONSTRAINT `GuestEditor_familyTreeId_fkey` FOREIGN KEY (`familyTreeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

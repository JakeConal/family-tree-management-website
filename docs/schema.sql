-- MySQL Database Schema for Family Tree Management System
-- Generated from Prisma Schema

-- Set SQL mode and character set
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS `GuestEditor`;
DROP TABLE IF EXISTS `SpouseRelationship`;
DROP TABLE IF EXISTS `BuriedPlace`;
DROP TABLE IF EXISTS `FamilyMember_has_PlaceOfOrigin`;
DROP TABLE IF EXISTS `PlaceOfOrigin`;
DROP TABLE IF EXISTS `CauseOfDeath`;
DROP TABLE IF EXISTS `PassingRecord`;
DROP TABLE IF EXISTS `Achievement`;
DROP TABLE IF EXISTS `AchievementType`;
DROP TABLE IF EXISTS `Occupation`;
DROP TABLE IF EXISTS `FamilyMember`;
DROP TABLE IF EXISTS `FamilyTree`;
DROP TABLE IF EXISTS `TreeOwner`;

-- Create TreeOwner table
CREATE TABLE `TreeOwner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fullName` VARCHAR(225) NOT NULL,
  `email` VARCHAR(225) NOT NULL,
  `passwordHash` VARCHAR(225) NOT NULL,
  `googleUserId` VARCHAR(225) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TreeOwner_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create FamilyTree table
CREATE TABLE `FamilyTree` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `treeName` VARCHAR(225) NOT NULL,
  `origin` VARCHAR(300) NOT NULL,
  `createdDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `treeOwnerId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FamilyTree_treeOwnerId_fkey` (`treeOwnerId`),
  CONSTRAINT `FamilyTree_treeOwnerId_fkey` FOREIGN KEY (`treeOwnerId`) REFERENCES `TreeOwner` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create FamilyMember table
CREATE TABLE `FamilyMember` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fullName` VARCHAR(225) NOT NULL,
  `gender` VARCHAR(45) NOT NULL,
  `address` VARCHAR(1000) NOT NULL,
  `profilePicture` VARCHAR(300) DEFAULT NULL,
  `generation` VARCHAR(45) NOT NULL,
  `isDeceased` TINYINT(1) NOT NULL DEFAULT 0,
  `familyTreeId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FamilyMember_familyTreeId_fkey` (`familyTreeId`),
  CONSTRAINT `FamilyMember_familyTreeId_fkey` FOREIGN KEY (`familyTreeId`) REFERENCES `FamilyTree` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Occupation table
CREATE TABLE `Occupation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `jobTitle` VARCHAR(225) NOT NULL,
  `endDate` DATETIME(3) DEFAULT NULL,
  `familyMemberId` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Occupation_familyMemberId_key` (`familyMemberId`),
  CONSTRAINT `Occupation_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create AchievementType table
CREATE TABLE `AchievementType` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `typeName` VARCHAR(225) NOT NULL,
  `familyTreeId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AchievementType_familyTreeId_fkey` (`familyTreeId`),
  CONSTRAINT `AchievementType_familyTreeId_fkey` FOREIGN KEY (`familyTreeId`) REFERENCES `FamilyTree` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Achievement table
CREATE TABLE `Achievement` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `achievedDate` DATETIME(3) NOT NULL,
  `title` VARCHAR(225) NOT NULL,
  `description` VARCHAR(5000) NOT NULL,
  `familyMemberId` INT NOT NULL,
  `achievementTypeId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Achievement_familyMemberId_fkey` (`familyMemberId`),
  KEY `Achievement_achievementTypeId_fkey` (`achievementTypeId`),
  CONSTRAINT `Achievement_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Achievement_achievementTypeId_fkey` FOREIGN KEY (`achievementTypeId`) REFERENCES `AchievementType` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create PassingRecord table
CREATE TABLE `PassingRecord` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `passingDate` DATETIME(3) NOT NULL,
  `familyMemberId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PassingRecord_familyMemberId_fkey` (`familyMemberId`),
  CONSTRAINT `PassingRecord_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create CauseOfDeath table
CREATE TABLE `CauseOfDeath` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cause` VARCHAR(225) NOT NULL,
  `deathDate` DATETIME(3) NOT NULL,
  `familyMemberId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CauseOfDeath_familyMemberId_fkey` (`familyMemberId`),
  CONSTRAINT `CauseOfDeath_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create PlaceOfOrigin table
CREATE TABLE `PlaceOfOrigin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `location` VARCHAR(1000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create FamilyMember_has_PlaceOfOrigin junction table
CREATE TABLE `FamilyMember_has_PlaceOfOrigin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) DEFAULT NULL,
  `familyMemberId` INT NOT NULL,
  `placeOfOriginId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FamilyMember_has_PlaceOfOrigin_familyMemberId_fkey` (`familyMemberId`),
  KEY `FamilyMember_has_PlaceOfOrigin_placeOfOriginId_fkey` (`placeOfOriginId`),
  CONSTRAINT `FamilyMember_has_PlaceOfOrigin_familyMemberId_fkey` FOREIGN KEY (`familyMemberId`) REFERENCES `FamilyMember` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FamilyMember_has_PlaceOfOrigin_placeOfOriginId_fkey` FOREIGN KEY (`placeOfOriginId`) REFERENCES `PlaceOfOrigin` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create BuriedPlace table
CREATE TABLE `BuriedPlace` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `location` VARCHAR(1000) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `description` VARCHAR(1000) NOT NULL,
  `placeOfOriginId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `BuriedPlace_placeOfOriginId_fkey` (`placeOfOriginId`),
  CONSTRAINT `BuriedPlace_placeOfOriginId_fkey` FOREIGN KEY (`placeOfOriginId`) REFERENCES `PlaceOfOrigin` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create SpouseRelationship table
CREATE TABLE `SpouseRelationship` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `marriageDate` DATETIME(3) NOT NULL,
  `divorceDate` DATETIME(3) DEFAULT NULL,
  `familyMember1Id` INT NOT NULL,
  `familyMember2Id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `SpouseRelationship_familyMember1Id_fkey` (`familyMember1Id`),
  KEY `SpouseRelationship_familyMember2Id_fkey` (`familyMember2Id`),
  CONSTRAINT `SpouseRelationship_familyMember1Id_fkey` FOREIGN KEY (`familyMember1Id`) REFERENCES `FamilyMember` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SpouseRelationship_familyMember2Id_fkey` FOREIGN KEY (`familyMember2Id`) REFERENCES `FamilyMember` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create GuestEditor table
CREATE TABLE `GuestEditor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `accessCode` VARCHAR(45) NOT NULL,
  `createdDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `familyTreeId` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `GuestEditor_familyTreeId_fkey` (`familyTreeId`),
  CONSTRAINT `GuestEditor_familyTreeId_fkey` FOREIGN KEY (`familyTreeId`) REFERENCES `FamilyTree` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for performance optimization
CREATE INDEX idx_familytree_owner ON `FamilyTree`(`treeOwnerId`);
CREATE INDEX idx_familymember_tree ON `FamilyMember`(`familyTreeId`);
CREATE INDEX idx_achievement_member ON `Achievement`(`familyMemberId`);
CREATE INDEX idx_achievement_type ON `Achievement`(`achievementTypeId`);
CREATE INDEX idx_spouse_member1 ON `SpouseRelationship`(`familyMember1Id`);
CREATE INDEX idx_spouse_member2 ON `SpouseRelationship`(`familyMember2Id`);
CREATE INDEX idx_guesteditor_tree ON `GuestEditor`(`familyTreeId`);

-- Comments for documentation
ALTER TABLE `TreeOwner` COMMENT = 'Stores user authentication and tree ownership information';
ALTER TABLE `FamilyTree` COMMENT = 'Stores family tree metadata and ownership';
ALTER TABLE `FamilyMember` COMMENT = 'Stores individual family member information';
ALTER TABLE `Occupation` COMMENT = 'Stores occupation/job information for family members';
ALTER TABLE `Achievement` COMMENT = 'Stores achievements and milestones for family members';
ALTER TABLE `AchievementType` COMMENT = 'Stores custom achievement types per family tree';
ALTER TABLE `PassingRecord` COMMENT = 'Stores passing/death records for deceased family members';
ALTER TABLE `CauseOfDeath` COMMENT = 'Stores cause of death information';
ALTER TABLE `PlaceOfOrigin` COMMENT = 'Stores locations/places of origin';
ALTER TABLE `FamilyMember_has_PlaceOfOrigin` COMMENT = 'Junction table linking family members to places they lived';
ALTER TABLE `BuriedPlace` COMMENT = 'Stores burial place information';
ALTER TABLE `SpouseRelationship` COMMENT = 'Stores marriage/spouse relationships between family members';
ALTER TABLE `GuestEditor` COMMENT = 'Stores guest editor access codes for collaborative editing';

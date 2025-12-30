/*
  Warnings:

  - You are about to drop the column `familyTreeId` on the `AchievementType` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[typeName]` on the table `AchievementType` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `AchievementType` DROP FOREIGN KEY `AchievementType_familyTreeId_fkey`;

-- AlterTable
ALTER TABLE `AchievementType` DROP COLUMN `familyTreeId`;

-- CreateIndex
CREATE UNIQUE INDEX `AchievementType_typeName_key` ON `AchievementType`(`typeName`);

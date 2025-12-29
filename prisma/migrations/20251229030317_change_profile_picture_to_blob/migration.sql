-- AlterTable
ALTER TABLE `FamilyMember` ADD COLUMN `profilePictureType` VARCHAR(50) NULL,
    MODIFY `profilePicture` MEDIUMBLOB NULL;

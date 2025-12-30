/*
  Warnings:

  - The values [OTHER] on the enum `FamilyMember_gender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `FamilyMember` MODIFY `gender` ENUM('MALE', 'FEMALE') NULL;

/*
  Warnings:

  - A unique constraint covering the columns `[accessCode]` on the table `GuestEditor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `GuestEditor_accessCode_key` ON `GuestEditor`(`accessCode`);

-- AddForeignKey
ALTER TABLE `ChangeLog` ADD CONSTRAINT `ChangeLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

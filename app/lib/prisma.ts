import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: "family-tree-blackyjake123-6784.f.aivencloud.com",
  port: 13461,
  user: "avnadmin",
  password: process.env.DATABASE_PASSWORD!,
  database: "defaultdb",
  ssl: true,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

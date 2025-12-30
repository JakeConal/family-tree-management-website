import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "../app/generated/prisma";

// Create LibSQL client for SQLite
const libsql = createClient({
    url: "file:dev.db",
});

// Create Prisma adapter
const adapter = new PrismaLibSQL(libsql);

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting seed...");

    // Clean existing data
    await prisma.causeOfDeath.deleteMany();
    await prisma.buriedPlace.deleteMany();
    await prisma.passingRecord.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.achievementType.deleteMany();
    await prisma.spouseRelationship.deleteMany();
    await prisma.occupation.deleteMany();
    await prisma.familyMember_has_PlaceOfOrigin.deleteMany();
    await prisma.placeOfOrigin.deleteMany();
    await prisma.guestEditor.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.familyTree.deleteMany();
    await prisma.treeOwner.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ Cleaned existing data");

    // Create a user
    const user = await prisma.user.create({
        data: {
            name: "Forrest Hunter",
            email: "forrest@example.com",
        },
    });
    console.log("✅ Created user:", user.name);

    // Create tree owner
    const treeOwner = await prisma.treeOwner.create({
        data: {
            fullName: "Forrest Hunter",
            userId: user.id,
        },
    });
    console.log("✅ Created tree owner:", treeOwner.fullName);

    // Create family tree
    const familyTree = await prisma.familyTree.create({
        data: {
            familyName: "Hunter Family",
            origin: "United States",
            establishYear: 1950,
            treeOwnerId: treeOwner.id,
        },
    });
    console.log("✅ Created family tree:", familyTree.familyName);

    // Create achievement types
    const achievementTypes = await Promise.all([
        prisma.achievementType.create({
            data: { typeName: "Graduation", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Career", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Sport", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Health", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Environment", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Artistic", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Financial", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Community", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Travel", familyTreeId: familyTree.id },
        }),
        prisma.achievementType.create({
            data: { typeName: "Skill Development", familyTreeId: familyTree.id },
        }),
    ]);
    console.log("✅ Created", achievementTypes.length, "achievement types");

    // Create family members
    const thomas = await prisma.familyMember.create({
        data: {
            fullName: "Thomas Hunter",
            gender: "MALE",
            birthday: new Date("1940-03-15"),
            address: "123 Oak Street, California",
            isRootPerson: true,
            generation: "1",
            familyTreeId: familyTree.id,
        },
    });

    const pablo = await prisma.familyMember.create({
        data: {
            fullName: "Pablo Hunter",
            gender: "MALE",
            birthday: new Date("1938-07-22"),
            address: "456 Pine Avenue, California",
            generation: "1",
            familyTreeId: familyTree.id,
        },
    });

    const forrest = await prisma.familyMember.create({
        data: {
            fullName: "Forrest Hunter",
            gender: "MALE",
            birthday: new Date("1975-05-10"),
            address: "789 Maple Drive, California",
            generation: "2",
            familyTreeId: familyTree.id,
            parentId: thomas.id,
        },
    });

    const ruben = await prisma.familyMember.create({
        data: {
            fullName: "Ruben Hunter",
            gender: "MALE",
            birthday: new Date("1990-11-25"),
            address: "321 Elm Street, California",
            generation: "3",
            familyTreeId: familyTree.id,
            parentId: forrest.id,
        },
    });

    const conrad = await prisma.familyMember.create({
        data: {
            fullName: "Conrad Hunter",
            gender: "MALE",
            birthday: new Date("1992-02-14"),
            address: "654 Cedar Lane, California",
            generation: "3",
            familyTreeId: familyTree.id,
            parentId: forrest.id,
        },
    });

    const geoffrey = await prisma.familyMember.create({
        data: {
            fullName: "Geoffrey",
            gender: "MALE",
            birthday: new Date("1988-08-30"),
            address: "987 Birch Road, California",
            generation: "3",
            familyTreeId: familyTree.id,
        },
    });

    const josh = await prisma.familyMember.create({
        data: {
            fullName: "Josh Cooper",
            gender: "MALE",
            birthday: new Date("1991-04-18"),
            address: "147 Willow Way, California",
            generation: "3",
            familyTreeId: familyTree.id,
        },
    });

    const salvatore = await prisma.familyMember.create({
        data: {
            fullName: "Salvatore",
            gender: "MALE",
            birthday: new Date("1993-09-05"),
            address: "258 Aspen Court, California",
            generation: "3",
            familyTreeId: familyTree.id,
        },
    });

    const ryan = await prisma.familyMember.create({
        data: {
            fullName: "Ryan",
            gender: "FEMALE",
            birthday: new Date("1980-12-01"),
            address: "369 Spruce Street, California",
            generation: "2",
            familyTreeId: familyTree.id,
        },
    });

    console.log("✅ Created 9 family members");

    // Update family tree with root member
    await prisma.familyTree.update({
        where: { id: familyTree.id },
        data: { rootMemberId: thomas.id },
    });

    // Create achievements for 2025
    const graduationType = achievementTypes.find((t) => t.typeName === "Graduation")!;
    const careerType = achievementTypes.find((t) => t.typeName === "Career")!;
    const sportType = achievementTypes.find((t) => t.typeName === "Sport")!;
    const healthType = achievementTypes.find((t) => t.typeName === "Health")!;
    const environmentType = achievementTypes.find((t) => t.typeName === "Environment")!;
    const artisticType = achievementTypes.find((t) => t.typeName === "Artistic")!;

    await prisma.achievement.createMany({
        data: [
            {
                title: "Master's Degree in Computer Science",
                achieveDate: new Date("2025-05-15"),
                description:
                    "Ruben graduated with honors from MIT with a Master's Degree in Computer Science.",
                familyMemberId: ruben.id,
                achievementTypeId: graduationType.id,
            },
            {
                title: 'Established "Hunter & Sons" Law Firm',
                achieveDate: new Date("2025-12-01"),
                description:
                    "Forrest founded and scaled Hunter & Sons into a leading regional corporate litigation firm.",
                familyMemberId: forrest.id,
                achievementTypeId: careerType.id,
            },
            {
                title: "Won State Basketball Championship",
                achieveDate: new Date("2025-03-12"),
                description:
                    "Geoffrey was the MVP of the 2005 State Championship, showcasing exceptional teamwork and skill.",
                familyMemberId: geoffrey.id,
                achievementTypeId: sportType.id,
            },
            {
                title: "Completed 75 Hard Fitness Challenge",
                achieveDate: new Date("2025-10-20"),
                description:
                    "Ruben finished the intense 75 Hard program, improving discipline and overall health.",
                familyMemberId: ruben.id,
                achievementTypeId: healthType.id,
            },
            {
                title: "Launched Community Recycling Initiative",
                achieveDate: new Date("2024-06-05"),
                description:
                    "Conrad led a neighborhood-wide multi-sort recycling program that boosted sustainability efforts.",
                familyMemberId: conrad.id,
                achievementTypeId: environmentType.id,
            },
            {
                title: "Published Debut Science Fiction Novel",
                achieveDate: new Date("2024-09-15"),
                description:
                    'Josh released "The Chronos Fragment," which quickly became a bestseller on indie charts.',
                familyMemberId: josh.id,
                achievementTypeId: artisticType.id,
            },
        ],
    });
    console.log("✅ Created 6 achievements");

    // Create spouse relationships
    await prisma.spouseRelationship.createMany({
        data: [
            {
                familyMember1Id: forrest.id,
                familyMember2Id: geoffrey.id,
                marriageDate: new Date("2018-05-20"),
            },
            {
                familyMember1Id: forrest.id,
                familyMember2Id: ryan.id,
                marriageDate: new Date("2010-06-15"),
                divorceDate: new Date("2016-05-11"),
            },
            {
                familyMember1Id: ruben.id,
                familyMember2Id: josh.id,
                marriageDate: new Date("2015-11-14"),
            },
            {
                familyMember1Id: conrad.id,
                familyMember2Id: salvatore.id,
                marriageDate: new Date("2015-11-14"),
            },
        ],
    });
    console.log("✅ Created 4 spouse relationships");

    // Create passing records
    const thomasPassingRecord = await prisma.passingRecord.create({
        data: {
            dateOfPassing: new Date("2015-08-15"),
            familyMemberId: thomas.id,
        },
    });

    await prisma.causeOfDeath.create({
        data: {
            causeName: "Stage IV pancreatic cancer, Severe weight loss",
            passingRecordId: thomasPassingRecord.id,
            familyMemberId: thomas.id,
        },
    });

    await prisma.buriedPlace.create({
        data: {
            location: "Family Tomb Area, Dong Nai",
            startDate: new Date("2015-08-20"),
            passingRecordId: thomasPassingRecord.id,
        },
    });

    const pabloPassingRecord = await prisma.passingRecord.create({
        data: {
            dateOfPassing: new Date("2010-11-22"),
            familyMemberId: pablo.id,
        },
    });

    await prisma.causeOfDeath.create({
        data: {
            causeName:
                "Advanced Alzheimer's disease, Respiratory failure, Pneumonia, General physical debilitation",
            passingRecordId: pabloPassingRecord.id,
            familyMemberId: pablo.id,
        },
    });

    await prisma.buriedPlace.createMany({
        data: [
            {
                location: "Lac Canh Vien Cemetery, Hoa Binh",
                startDate: new Date("2010-11-22"),
                endDate: new Date("2011-12-11"),
                passingRecordId: pabloPassingRecord.id,
            },
            {
                location: "Vinh Hang Memorial Park, Ha Noi",
                startDate: new Date("2011-12-12"),
                passingRecordId: pabloPassingRecord.id,
            },
        ],
    });
    console.log("✅ Created 2 passing records with causes of death and burial places");

    // Create occupations
    await prisma.occupation.createMany({
        data: [
            {
                jobTitle: "Lawyer",
                startDate: new Date("2000-01-01"),
                familyMemberId: forrest.id,
            },
            {
                jobTitle: "Software Engineer",
                startDate: new Date("2018-06-01"),
                familyMemberId: ruben.id,
            },
            {
                jobTitle: "Environmental Scientist",
                startDate: new Date("2019-03-15"),
                familyMemberId: conrad.id,
            },
            {
                jobTitle: "Basketball Coach",
                startDate: new Date("2015-09-01"),
                familyMemberId: geoffrey.id,
            },
            {
                jobTitle: "Author",
                startDate: new Date("2020-01-01"),
                familyMemberId: josh.id,
            },
        ],
    });
    console.log("✅ Created 5 occupations");

    console.log("🎉 Seed completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

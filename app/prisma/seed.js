// Simple seed script using better-sqlite3
const Database = require("better-sqlite3");

const db = new Database("dev.db");

console.log("🌱 Starting seed...");

// Clean existing data
const tables = [
    "CauseOfDeath",
    "BuriedPlace",
    "PassingRecord",
    "Achievement",
    "AchievementType",
    "SpouseRelationship",
    "Occupation",
    "FamilyMember_has_PlaceOfOrigin",
    "PlaceOfOrigin",
    "GuestEditor",
    "FamilyMember",
    "FamilyTree",
    "TreeOwner",
    "users",
];

for (const table of tables) {
    try {
        db.exec(`DELETE FROM ${table}`);
    } catch (e) {
        // Table might not exist, ignore
    }
}
console.log("✅ Cleaned existing data");

// Helper function to generate cuid-like ID
function cuid() {
    return "c" + Math.random().toString(36).substr(2, 24);
}

// Create user
const userId = cuid();
db.prepare(`INSERT INTO users (id, name, email) VALUES (?, ?, ?)`).run(
    userId,
    "Forrest Hunter",
    "forrest@example.com"
);
console.log("✅ Created user: Forrest Hunter");

// Create tree owner
const treeOwnerStmt = db.prepare(`INSERT INTO TreeOwner (fullName, userId, createdAt) VALUES (?, ?, datetime('now'))`);
const treeOwnerResult = treeOwnerStmt.run("Forrest Hunter", userId);
const treeOwnerId = treeOwnerResult.lastInsertRowid;
console.log("✅ Created tree owner: Forrest Hunter");

// Create family tree
const familyTreeStmt = db.prepare(`INSERT INTO FamilyTree (familyName, origin, establishYear, treeOwnerId, createdAt) VALUES (?, ?, ?, ?, datetime('now'))`);
const familyTreeResult = familyTreeStmt.run("Hunter Family", "United States", 1950, treeOwnerId);
const familyTreeId = familyTreeResult.lastInsertRowid;
console.log("✅ Created family tree: Hunter Family");

// Create achievement types
const achievementTypeStmt = db.prepare(`INSERT INTO AchievementType (typeName, familyTreeId) VALUES (?, ?)`);
const achievementTypes = [
    "Graduation", "Career", "Sport", "Health", "Environment",
    "Artistic", "Financial", "Community", "Travel", "Skill Development"
];
const achievementTypeIds = {};
for (const typeName of achievementTypes) {
    const result = achievementTypeStmt.run(typeName, familyTreeId);
    achievementTypeIds[typeName] = result.lastInsertRowid;
}
console.log("✅ Created", achievementTypes.length, "achievement types");

// Create family members
const memberStmt = db.prepare(`
  INSERT INTO FamilyMember (fullName, gender, birthday, address, isRootPerson, generation, familyTreeId, parentId)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Thomas (root)
const thomasResult = memberStmt.run("Thomas Hunter", "MALE", "1940-03-15", "123 Oak Street, California", 1, "1", familyTreeId, null);
const thomasId = thomasResult.lastInsertRowid;

// Pablo
const pabloResult = memberStmt.run("Pablo Hunter", "MALE", "1938-07-22", "456 Pine Avenue, California", 0, "1", familyTreeId, null);
const pabloId = pabloResult.lastInsertRowid;

// Forrest (child of Thomas)
const forrestResult = memberStmt.run("Forrest Hunter", "MALE", "1975-05-10", "789 Maple Drive, California", 0, "2", familyTreeId, thomasId);
const forrestId = forrestResult.lastInsertRowid;

// Ruben (child of Forrest)
const rubenResult = memberStmt.run("Ruben Hunter", "MALE", "1990-11-25", "321 Elm Street, California", 0, "3", familyTreeId, forrestId);
const rubenId = rubenResult.lastInsertRowid;

// Conrad (child of Forrest)
const conradResult = memberStmt.run("Conrad Hunter", "MALE", "1992-02-14", "654 Cedar Lane, California", 0, "3", familyTreeId, forrestId);
const conradId = conradResult.lastInsertRowid;

// Geoffrey
const geoffreyResult = memberStmt.run("Geoffrey", "MALE", "1988-08-30", "987 Birch Road, California", 0, "3", familyTreeId, null);
const geoffreyId = geoffreyResult.lastInsertRowid;

// Josh Cooper
const joshResult = memberStmt.run("Josh Cooper", "MALE", "1991-04-18", "147 Willow Way, California", 0, "3", familyTreeId, null);
const joshId = joshResult.lastInsertRowid;

// Salvatore
const salvatoreResult = memberStmt.run("Salvatore", "MALE", "1993-09-05", "258 Aspen Court, California", 0, "3", familyTreeId, null);
const salvatoreId = salvatoreResult.lastInsertRowid;

// Ryan
const ryanResult = memberStmt.run("Ryan", "FEMALE", "1980-12-01", "369 Spruce Street, California", 0, "2", familyTreeId, null);
const ryanId = ryanResult.lastInsertRowid;

console.log("✅ Created 9 family members");

// Update family tree with root member
db.prepare(`UPDATE FamilyTree SET rootMemberId = ? WHERE id = ?`).run(thomasId, familyTreeId);

// Create achievements
const achievementStmt = db.prepare(`
  INSERT INTO Achievement (title, achieveDate, description, familyMemberId, achievementTypeId)
  VALUES (?, ?, ?, ?, ?)
`);

achievementStmt.run(
    "Master's Degree in Computer Science",
    "2025-05-15",
    "Ruben graduated with honors from MIT with a Master's Degree in Computer Science.",
    rubenId,
    achievementTypeIds["Graduation"]
);

achievementStmt.run(
    'Established "Hunter & Sons" Law Firm',
    "2025-12-01",
    "Forrest founded and scaled Hunter & Sons into a leading regional corporate litigation firm.",
    forrestId,
    achievementTypeIds["Career"]
);

achievementStmt.run(
    "Won State Basketball Championship",
    "2025-03-12",
    "Geoffrey was the MVP of the 2005 State Championship, showcasing exceptional teamwork and skill.",
    geoffreyId,
    achievementTypeIds["Sport"]
);

achievementStmt.run(
    "Completed 75 Hard Fitness Challenge",
    "2025-10-20",
    "Ruben finished the intense 75 Hard program, improving discipline and overall health.",
    rubenId,
    achievementTypeIds["Health"]
);

achievementStmt.run(
    "Launched Community Recycling Initiative",
    "2024-06-05",
    "Conrad led a neighborhood-wide multi-sort recycling program that boosted sustainability efforts.",
    conradId,
    achievementTypeIds["Environment"]
);

achievementStmt.run(
    "Published Debut Science Fiction Novel",
    "2024-09-15",
    'Josh released "The Chronos Fragment," which quickly became a bestseller on indie charts.',
    joshId,
    achievementTypeIds["Artistic"]
);

console.log("✅ Created 6 achievements");

// Create spouse relationships
const spouseStmt = db.prepare(`
  INSERT INTO SpouseRelationship (familyMember1Id, familyMember2Id, marriageDate, divorceDate)
  VALUES (?, ?, ?, ?)
`);

spouseStmt.run(forrestId, geoffreyId, "2018-05-20", null);
spouseStmt.run(forrestId, ryanId, "2010-06-15", "2016-05-11");
spouseStmt.run(rubenId, joshId, "2015-11-14", null);
spouseStmt.run(conradId, salvatoreId, "2015-11-14", null);

console.log("✅ Created 4 spouse relationships");

// Create passing records
const passingStmt = db.prepare(`
  INSERT INTO PassingRecord (dateOfPassing, familyMemberId, createdAt)
  VALUES (?, ?, datetime('now'))
`);

const thomasPassingResult = passingStmt.run("2015-08-15", thomasId);
const thomasPassingId = thomasPassingResult.lastInsertRowid;

const pabloPassingResult = passingStmt.run("2010-11-22", pabloId);
const pabloPassingId = pabloPassingResult.lastInsertRowid;

// Create causes of death
const causeStmt = db.prepare(`
  INSERT INTO CauseOfDeath (causeName, passingRecordId, familyMemberId)
  VALUES (?, ?, ?)
`);

causeStmt.run("Stage IV pancreatic cancer, Severe weight loss", thomasPassingId, thomasId);
causeStmt.run("Advanced Alzheimer's disease, Respiratory failure, Pneumonia, General physical debilitation", pabloPassingId, pabloId);

// Create burial places
const burialStmt = db.prepare(`
  INSERT INTO BuriedPlace (location, startDate, endDate, passingRecordId)
  VALUES (?, ?, ?, ?)
`);

burialStmt.run("Family Tomb Area, Dong Nai", "2015-08-20", null, thomasPassingId);
burialStmt.run("Lac Canh Vien Cemetery, Hoa Binh", "2010-11-22", "2011-12-11", pabloPassingId);
burialStmt.run("Vinh Hang Memorial Park, Ha Noi", "2011-12-12", null, pabloPassingId);

console.log("✅ Created 2 passing records with causes of death and burial places");

// Create occupations
const occupationStmt = db.prepare(`
  INSERT INTO Occupation (jobTitle, startDate, familyMemberId)
  VALUES (?, ?, ?)
`);

occupationStmt.run("Lawyer", "2000-01-01", forrestId);
occupationStmt.run("Software Engineer", "2018-06-01", rubenId);
occupationStmt.run("Environmental Scientist", "2019-03-15", conradId);
occupationStmt.run("Basketball Coach", "2015-09-01", geoffreyId);
occupationStmt.run("Author", "2020-01-01", joshId);

console.log("✅ Created 5 occupations");

db.close();
console.log("🎉 Seed completed successfully!");

# Database Setup Guide for Family Tree Management System

## Prerequisites
- MySQL 8.0 or higher
- Node.js 18 or higher
- npm or yarn package manager

## Initial Setup

### 1. Create Database
```sql
CREATE DATABASE family_tree_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Environment Variables
Create a `.env` file in the `/app` directory:

```env
DATABASE_URL="mysql://username:password@localhost:3306/family_tree_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Replace `username` and `password` with your MySQL credentials.

### 3. Install Dependencies
```bash
cd app
npm install
```

### 4. Run Prisma Migrations
```bash
npx prisma generate
npx prisma db push
```

This will create all the necessary tables based on the schema.

### 5. Seed Database with Sample Data
```bash
mysql -u username -p family_tree_db < ../docs/db-seed.sql
```

Or using MySQL Workbench or any MySQL client, run the `db-seed.sql` file.

## Sample Data Overview

The seed file includes:
- **3 Tree Owners** (users) with different authentication methods
- **3 Family Trees** with different origins (UK, Sweden, China)
- **14 Family Members** across multiple generations
- **4 Occupations** for current family members
- **6 Achievement Types** (Education, Career, Awards, etc.)
- **4 Sample Achievements** 
- **4 Spouse Relationships** showing marriages
- **8 Places of Origin** across different countries
- **9 Family Member Location Records**
- **4 Passing Records** with causes of death
- **4 Burial Places**
- **3 Guest Editor Access Codes**

## Database Structure

### Core Tables
- **TreeOwner**: User accounts and authentication
- **FamilyTree**: Family tree metadata
- **FamilyMember**: Individual family members

### Relationship Tables
- **SpouseRelationship**: Marriage relationships
- **FamilyMember_has_PlaceOfOrigin**: Birth/living locations

### Additional Data Tables
- **Occupation**: Current jobs
- **Achievement**: Milestones and accomplishments
- **AchievementType**: Categories of achievements
- **PassingRecord**: Death records
- **CauseOfDeath**: Death causes
- **PlaceOfOrigin**: Location data
- **BuriedPlace**: Burial information
- **GuestEditor**: Shared access codes

## Verification Queries

After seeding, verify the data:

```sql
-- Check all tree owners
SELECT * FROM TreeOwner;

-- Check family trees
SELECT * FROM FamilyTree;

-- View family members with their trees
SELECT fm.fullName, fm.gender, fm.generation, ft.treeName 
FROM FamilyMember fm 
JOIN FamilyTree ft ON fm.familyTreeId = ft.id;

-- View marriages
SELECT 
  fm1.fullName AS spouse1,
  fm2.fullName AS spouse2,
  sr.marriageDate,
  sr.divorceDate
FROM SpouseRelationship sr
JOIN FamilyMember fm1 ON sr.familyMember1Id = fm1.id
JOIN FamilyMember fm2 ON sr.familyMember2Id = fm2.id;

-- View achievements
SELECT 
  fm.fullName,
  a.title,
  at.typeName,
  a.achievedDate
FROM Achievement a
JOIN FamilyMember fm ON a.familyMemberId = fm.id
JOIN AchievementType at ON a.achievementTypeId = at.id;
```

## Development Credentials

### Sample User Accounts
1. **John Smith**
   - Email: john.smith@example.com
   - Password: (hashed, generate your own)
   
2. **Sarah Johnson**
   - Email: sarah.johnson@example.com
   - Password: (hashed, generate your own)
   
3. **Michael Chen**
   - Email: michael.chen@example.com
   - Password: (hashed, generate your own)
   - Google OAuth: Connected

### Guest Access Codes
- Smith Family: `SMITH2024`
- Johnson Heritage: `JOHNSON2024`
- Chen Dynasty: `CHEN2024`

## Notes for Developers

1. **Password Hashes**: The seed file contains placeholder password hashes. In production, use bcrypt to generate proper hashes.

2. **Prisma Client**: After running migrations, regenerate the Prisma client:
   ```bash
   npx prisma generate
   ```

3. **Database Reset**: To reset the database:
   ```bash
   npx prisma db push --force-reset
   # Then re-run the seed file
   ```

4. **Prisma Studio**: To view/edit data visually:
   ```bash
   npx prisma studio
   ```

5. **Data Relationships**: All foreign key constraints are properly set with CASCADE delete, so deleting a FamilyTree will remove all related data.

## Troubleshooting

### Migration Issues
If you encounter migration errors:
```bash
npx prisma migrate reset
npx prisma db push
```

### Connection Issues
- Verify MySQL is running
- Check DATABASE_URL in .env
- Ensure database user has proper permissions

### Seed Data Issues
- Run queries individually if bulk insert fails
- Check for proper character encoding (utf8mb4)
- Verify all referenced IDs exist before inserting

## Next Steps

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the application at `http://localhost:3000`

3. Login or register a new account

4. Explore the sample family trees

For more information, refer to the main README.md file.

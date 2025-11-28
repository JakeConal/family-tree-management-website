-- Family Tree Management System - Database Seed Data
-- This file contains sample data for development purposes
-- Run this after creating your database schema

-- Insert Sample Tree Owners (Users)
INSERT INTO TreeOwner (fullName, email, passwordHash, googleUserId) VALUES
('John Smith', 'john.smith@example.com', '$2a$10$XYZ123...', NULL),
('Sarah Johnson', 'sarah.johnson@example.com', '$2a$10$ABC456...', NULL),
('Michael Chen', 'michael.chen@example.com', '$2a$10$DEF789...', 'google_123456');

-- Insert Sample Family Trees
INSERT INTO FamilyTree (treeName, origin, createdDate, treeOwnerId) VALUES
('Smith Family Tree', 'United Kingdom', '2024-01-15 10:30:00', 1),
('Johnson Heritage', 'Sweden', '2024-02-20 14:45:00', 2),
('Chen Dynasty', 'China', '2024-03-10 09:00:00', 3);

-- Insert Sample Family Members for Smith Family Tree
INSERT INTO FamilyMember (fullName, gender, address, profilePicture, generation, isDeceased, familyTreeId) VALUES
-- Generation 1 (Grandparents)
('Robert Smith', 'Male', '123 Oak Street, London, UK', NULL, 'Generation 1', 1, 1),
('Margaret Smith', 'Female', '123 Oak Street, London, UK', NULL, 'Generation 1', 1, 1),
('William Brown', 'Male', '456 Elm Avenue, Manchester, UK', NULL, 'Generation 1', 1, 1),
('Elizabeth Brown', 'Female', '456 Elm Avenue, Manchester, UK', NULL, 'Generation 1', 1, 1),

-- Generation 2 (Parents)
('John Smith', 'Male', '789 Maple Road, Birmingham, UK', NULL, 'Generation 2', 0, 1),
('Mary Smith', 'Female', '789 Maple Road, Birmingham, UK', NULL, 'Generation 2', 0, 1),
('David Smith', 'Male', '321 Pine Street, Liverpool, UK', NULL, 'Generation 2', 0, 1),

-- Generation 3 (Current)
('James Smith', 'Male', '555 Cedar Lane, London, UK', NULL, 'Generation 3', 0, 1),
('Emma Smith', 'Female', '555 Cedar Lane, London, UK', NULL, 'Generation 3', 0, 1),
('Oliver Smith', 'Male', '777 Birch Court, Oxford, UK', NULL, 'Generation 3', 0, 1);

-- Insert Sample Family Members for Johnson Heritage
INSERT INTO FamilyMember (fullName, gender, address, profilePicture, generation, isDeceased, familyTreeId) VALUES
('Erik Johnson', 'Male', 'Stockholm, Sweden', NULL, 'Generation 1', 1, 2),
('Ingrid Johnson', 'Female', 'Stockholm, Sweden', NULL, 'Generation 1', 1, 2),
('Lars Johnson', 'Male', 'Gothenburg, Sweden', NULL, 'Generation 2', 0, 2),
('Sarah Johnson', 'Female', 'Malmo, Sweden', NULL, 'Generation 3', 0, 2);

-- Insert Sample Occupations
INSERT INTO Occupation (jobTitle, endDate, familyMemberId) VALUES
('Software Engineer', NULL, 5),
('Teacher', NULL, 6),
('Doctor', NULL, 8),
('Architect', NULL, 13);

-- Insert Sample Achievement Types
INSERT INTO AchievementType (typeName, familyTreeId) VALUES
('Education', 1),
('Career', 1),
('Awards', 1),
('Sports', 1),
('Community Service', 1),
('Military', 1);

-- Insert Sample Achievements
INSERT INTO Achievement (achievedDate, title, description, familyMemberId, achievementTypeId) VALUES
('2010-06-15', 'Bachelor of Science', 'Graduated with honors from Oxford University', 8, 1),
('2015-03-20', 'Promoted to Senior Engineer', 'Achieved senior position at tech company', 5, 2),
('2018-11-10', 'Community Leader Award', 'Recognized for community development initiatives', 6, 5),
('2020-05-05', 'Marathon Completion', 'Completed London Marathon in under 4 hours', 9, 4);

-- Insert Sample Spouse Relationships
INSERT INTO SpouseRelationship (marriageDate, divorceDate, familyMember1Id, familyMember2Id) VALUES
('1950-06-15', '1990-12-20', 1, 2),  -- Robert & Margaret Smith
('1952-08-20', NULL, 3, 4),          -- William & Elizabeth Brown
('1978-05-10', NULL, 5, 6),          -- John & Mary Smith
('2015-09-25', NULL, 8, 9);          -- James & Emma Smith

-- Insert Sample Places of Origin
INSERT INTO PlaceOfOrigin (location) VALUES
('London, England, United Kingdom'),
('Manchester, England, United Kingdom'),
('Birmingham, England, United Kingdom'),
('Liverpool, England, United Kingdom'),
('Oxford, England, United Kingdom'),
('Stockholm, Sweden'),
('Gothenburg, Sweden'),
('Beijing, China');

-- Insert Family Member Birth/Living Places
INSERT INTO FamilyMember_has_PlaceOfOrigin (startDate, endDate, familyMemberId, placeOfOriginId) VALUES
('1925-03-15', '2015-08-20', 1, 1),  -- Robert Smith in London
('1928-07-22', '2018-04-10', 2, 1),  -- Margaret Smith in London
('1930-11-05', '2019-12-25', 3, 2),  -- William Brown in Manchester
('1932-02-18', '2020-06-30', 4, 2),  -- Elizabeth Brown in Manchester
('1955-09-10', NULL, 5, 3),          -- John Smith in Birmingham
('1958-04-25', NULL, 6, 3),          -- Mary Smith in Birmingham
('1980-12-08', NULL, 8, 1),          -- James Smith in London
('1982-06-15', NULL, 9, 1),          -- Emma Smith in London
('1990-08-20', NULL, 11, 6);         -- Erik Johnson in Stockholm

-- Insert Passing Records
INSERT INTO PassingRecord (createDate, passingDate, familyMemberId) VALUES
('2015-08-21', '2015-08-20', 1),  -- Robert Smith
('2018-04-11', '2018-04-10', 2),  -- Margaret Smith
('2019-12-26', '2019-12-25', 3),  -- William Brown
('2020-07-01', '2020-06-30', 4);  -- Elizabeth Brown

-- Insert Causes of Death
INSERT INTO CauseOfDeath (cause, deathDate, familyMemberId) VALUES
('Natural causes', '2015-08-20', 1),
('Heart disease', '2018-04-10', 2),
('Pneumonia', '2019-12-25', 3),
('Cancer', '2020-06-30', 4);

-- Insert Buried Places
INSERT INTO BuriedPlace (location, startDate, description, placeOfOriginId) VALUES
('Highgate Cemetery, London', '2015-08-25', 'Historic Victorian cemetery in North London', 1),
('City of London Cemetery', '2018-04-15', 'Large municipal cemetery in East London', 1),
('Southern Cemetery, Manchester', '2019-12-30', 'Major cemetery in Manchester', 2),
('St James Cemetery, Liverpool', '2020-07-05', 'Victorian cemetery in Liverpool', 4);

-- Insert Guest Editor Access Codes
INSERT INTO GuestEditor (accessCode, createdDate, familyTreeId) VALUES
('SMITH2024', '2024-01-15 10:30:00', 1),
('JOHNSON2024', '2024-02-20 14:45:00', 2),
('CHEN2024', '2024-03-10 09:00:00', 3);

-- Sample queries to verify data
-- SELECT * FROM TreeOwner;
-- SELECT * FROM FamilyTree;
-- SELECT * FROM FamilyMember WHERE familyTreeId = 1;
-- SELECT fm.fullName, o.jobTitle FROM FamilyMember fm LEFT JOIN Occupation o ON fm.id = o.familyMemberId;
-- SELECT fm.fullName, a.title, at.typeName FROM Achievement a JOIN FamilyMember fm ON a.familyMemberId = fm.id JOIN AchievementType at ON a.achievementTypeId = at.id;

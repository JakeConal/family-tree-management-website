import { getPrisma } from '../lib/prisma';

async function main() {
	const prisma = getPrisma();

	const familyTreeId = 6;

	console.log(`🌱 Starting seed for family tree ${familyTreeId}...`);

	try {
		// Check if family tree exists
		const familyTree = await prisma.familyTree.findUnique({
			where: { id: familyTreeId },
		});

		if (!familyTree) {
			console.error(`❌ Family tree with id ${familyTreeId} not found`);
			process.exit(1);
		}

		console.log(`✅ Found family tree: ${familyTree.familyName}`);

		// Get or create achievement types for this family tree
		const achievementTypes = await Promise.all([
			prisma.achievementType.upsert({
				where: { typeName: 'Graduation' },
				update: {},
				create: { typeName: 'Graduation' },
			}),
			prisma.achievementType.upsert({
				where: { typeName: 'Career' },
				update: {},
				create: { typeName: 'Career' },
			}),
			prisma.achievementType.upsert({
				where: { typeName: 'Sport' },
				update: {},
				create: { typeName: 'Sport' },
			}),
			prisma.achievementType.upsert({
				where: { typeName: 'Health' },
				update: {},
				create: { typeName: 'Health' },
			}),
		]);

		console.log(`✅ Created/Updated ${achievementTypes.length} achievement types`);

		// Create root family member if it doesn't exist
		let rootMember = await prisma.familyMember.findFirst({
			where: {
				familyTreeId: familyTreeId,
				isRootPerson: true,
			},
		});

		if (!rootMember) {
			rootMember = await prisma.familyMember.create({
				data: {
					fullName: 'Huynh Thai Toan',
					gender: null,
					birthday: new Date('2010-02-13'),
					address: 'Dong Thap',
					generation: '0',
					isRootPerson: true,
					familyTreeId: familyTreeId,
				},
			});

			// Update family tree with root member
			await prisma.familyTree.update({
				where: { id: familyTreeId },
				data: { rootMemberId: rootMember.id },
			});

			console.log(`✅ Created root family member: ${rootMember.fullName}`);
		} else {
			console.log(`✅ Root family member already exists: ${rootMember.fullName}`);
		}

		// Create generation 1 members (parents)
		const father = await prisma.familyMember.create({
			data: {
				fullName: 'Huynh Van A',
				gender: 'MALE',
				birthday: new Date('1950-05-10'),
				address: 'Dong Thap',
				generation: '1',
				familyTreeId: familyTreeId,
				parentId: rootMember.id, // Link to root person
			},
		});

		const mother = await prisma.familyMember.create({
			data: {
				fullName: 'Tran Thi B',
				gender: 'FEMALE',
				birthday: new Date('1952-08-20'),
				address: 'Dong Thap',
				generation: '1',
				familyTreeId: familyTreeId,
				parentId: rootMember.id, // Link to root person
			},
		});

		console.log(`✅ Created generation 1 members (2 parents)`);

		// Create spouse relationship
		await prisma.spouseRelationship.create({
			data: {
				familyMember1Id: father.id,
				familyMember2Id: mother.id,
				marriageDate: new Date('1975-12-01'),
			},
		});

		console.log(`✅ Created spouse relationship`);

		// Create generation 2 members (current person's generation)
		const brother1 = await prisma.familyMember.create({
			data: {
				fullName: 'Huynh Van C',
				gender: 'MALE',
				birthday: new Date('1980-03-15'),
				address: 'Dong Thap',
				generation: '2',
				familyTreeId: familyTreeId,
				parentId: father.id,
			},
		});

		const sister = await prisma.familyMember.create({
			data: {
				fullName: 'Huynh Thi D',
				gender: 'FEMALE',
				birthday: new Date('1985-07-22'),
				address: 'Dong Thap',
				generation: '2',
				familyTreeId: familyTreeId,
				parentId: father.id,
			},
		});

		const brother2 = await prisma.familyMember.create({
			data: {
				fullName: 'Huynh Van E',
				gender: 'MALE',
				birthday: new Date('1988-11-30'),
				address: 'Dong Thap',
				generation: '2',
				familyTreeId: familyTreeId,
				parentId: father.id,
			},
		});

		console.log(`✅ Created generation 2 members (3 siblings)`);

		// Create generation 3 members (children)
		const nephew1 = await prisma.familyMember.create({
			data: {
				fullName: 'Huynh Van F',
				gender: 'MALE',
				birthday: new Date('2005-04-18'),
				address: 'Dong Thap',
				generation: '3',
				familyTreeId: familyTreeId,
				parentId: brother1.id,
			},
		});

		const niece = await prisma.familyMember.create({
			data: {
				fullName: 'Huynh Thi G',
				gender: 'FEMALE',
				birthday: new Date('2008-09-25'),
				address: 'Dong Thap',
				generation: '3',
				familyTreeId: familyTreeId,
				parentId: brother1.id,
			},
		});

		const nephew2 = await prisma.familyMember.create({
			data: {
				fullName: 'Huynh Van H',
				gender: 'MALE',
				birthday: new Date('2012-01-10'),
				address: 'Dong Thap',
				generation: '3',
				familyTreeId: familyTreeId,
				parentId: sister.id,
			},
		});

		console.log(`✅ Created generation 3 members (3 nieces/nephews)`);

		// Create occupations
		await prisma.occupation.createMany({
			data: [
				{
					jobTitle: 'Teacher',
					startDate: new Date('2000-01-01'),
					familyMemberId: father.id,
				},
				{
					jobTitle: 'Nurse',
					startDate: new Date('1975-06-01'),
					familyMemberId: mother.id,
				},
				{
					jobTitle: 'Engineer',
					startDate: new Date('2005-07-01'),
					familyMemberId: brother1.id,
				},
				{
					jobTitle: 'Doctor',
					startDate: new Date('2010-09-01'),
					familyMemberId: sister.id,
				},
				{
					jobTitle: 'Software Developer',
					startDate: new Date('2015-01-01'),
					familyMemberId: brother2.id,
				},
			],
		});

		console.log(`✅ Created 5 occupations`);

		// Create achievements
		const graduationType = achievementTypes.find((t) => t.typeName === 'Graduation')!;
		const careerType = achievementTypes.find((t) => t.typeName === 'Career')!;

		await prisma.achievement.createMany({
			data: [
				{
					title: "Bachelor's Degree in Computer Science",
					achieveDate: new Date('2015-06-15'),
					description: 'Graduated with honors from Ho Chi Minh University of Technology',
					familyMemberId: rootMember.id,
					achievementTypeId: graduationType.id,
				},
				{
					title: 'Promoted to Senior Engineer',
					achieveDate: new Date('2023-01-15'),
					description: 'Promoted to Senior Engineer at a leading tech company',
					familyMemberId: brother1.id,
					achievementTypeId: careerType.id,
				},
			],
		});

		console.log(`✅ Created achievements`);

		console.log('🎉 Seed for family tree completed successfully!');
	} catch (error) {
		console.error('❌ Seed failed:', error);
		process.exit(1);
	}
}

main();

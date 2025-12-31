import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getPrisma } from './prisma';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function logChange(
	entityType: string,
	entityId: number,
	action: 'CREATE' | 'UPDATE' | 'DELETE',
	familyTreeId: number,
	userId?: string,
	oldValues?: Record<string, unknown> | null,
	newValues?: Record<string, unknown> | null
) {
	try {
		const prisma = getPrisma();

		await prisma.changeLog.create({
			data: {
				entityType,
				entityId,
				action,
				userId: userId || null,
				familyTreeId,
				oldValues: oldValues ? JSON.stringify(oldValues) : null,
				newValues: newValues ? JSON.stringify(newValues) : null,
			},
		});
	} catch (error) {
		console.error('Failed to log change:', error);
		// Don't throw error to avoid breaking the main operation
	}
}

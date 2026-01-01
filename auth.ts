import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { getPrisma } from './lib/prisma';

// Extend NextAuth types to include guest fields
declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			email?: string | null;
			name?: string | null;
			image?: string | null;
		};
		role?: 'owner' | 'guest';
		guestMemberId?: number;
		guestFamilyTreeId?: number;
		guestEditorId?: number;
	}

	interface User {
		id: string;
		email?: string | null;
		name?: string | null;
		role?: 'owner' | 'guest';
		guestMemberId?: number;
		guestFamilyTreeId?: number;
		guestEditorId?: number;
	}
}

declare module 'next-auth' {
	interface JWT {
		id: string;
		role?: 'owner' | 'guest';
		guestMemberId?: number;
		guestFamilyTreeId?: number;
		guestEditorId?: number;
	}
}

const authConfig: NextAuthConfig = {
	adapter: PrismaAdapter(getPrisma()),
	session: {
		strategy: 'jwt',
	},
	providers: [
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? [
					GoogleProvider({
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					}),
				]
			: []),

		CredentialsProvider({
			id: 'credentials',
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const email = credentials.email as string;
				const password = credentials.password as string;

				const prisma = getPrisma();
				const user = await prisma.user.findUnique({
					where: { email },
				});

				if (!user || !user.password) {
					return null;
				}

				const isPasswordValid = await bcrypt.compare(password, user.password);

				if (!isPasswordValid) {
					return null;
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: 'owner' as const,
				};
			},
		}),

		CredentialsProvider({
			id: 'guest',
			name: 'Guest',
			credentials: {
				accessCode: { label: 'Access Code', type: 'text' },
			},
			async authorize(credentials) {
				if (!credentials?.accessCode) {
					return null;
				}

				const accessCode = credentials.accessCode as string;

				// Validate access code format (45 characters)
				if (accessCode.length !== 45) {
					return null;
				}

				const prisma = getPrisma();
				// Using findFirst until Prisma client is regenerated after migration
				const guestEditor = await prisma.guestEditor.findFirst({
					where: { accessCode },
					include: {
						familyMember: {
							select: {
								id: true,
								fullName: true,
							},
						},
						familyTree: {
							select: {
								id: true,
								familyName: true,
							},
						},
					},
				});

				if (!guestEditor) {
					return null;
				}

				// Check if code has expired (48 hours)
				const fortyEightHoursAgo = new Date();
				fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

				if (guestEditor.createDate < fortyEightHoursAgo) {
					return null;
				}

				// Return guest user object
				return {
					id: `guest-${guestEditor.id}`,
					name: guestEditor.familyMember.fullName,
					email: null,
					role: 'guest' as const,
					guestMemberId: guestEditor.familyMemberId,
					guestFamilyTreeId: guestEditor.familyTreeId,
					guestEditorId: guestEditor.id,
				};
			},
		}),
	],
	pages: {
		signIn: '/welcome/login',
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role || 'owner';
				token.guestMemberId = user.guestMemberId;
				token.guestFamilyTreeId = user.guestFamilyTreeId;
				token.guestEditorId = user.guestEditorId;
			}
			return token;
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.id as string;
				session.role =
					typeof token.role === 'string' && (token.role === 'owner' || token.role === 'guest') ? token.role : 'owner';

				session.guestMemberId = typeof token.guestMemberId === 'number' ? token.guestMemberId : undefined;
				session.guestFamilyTreeId = typeof token.guestFamilyTreeId === 'number' ? token.guestFamilyTreeId : undefined;
				session.guestEditorId = typeof token.guestEditorId === 'number' ? token.guestEditorId : undefined;
			}
			return session;
		},
	},
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

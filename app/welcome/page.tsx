'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, KeyRound, ChevronRight } from 'lucide-react';
import { RippleButton } from '@/components/ui/ripple-button';

export default function WelcomePage() {
	const { status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'authenticated') {
			router.push('/dashboard');
		}
	}, [status, router]);

	// Show loading state while checking authentication
	if (status === 'loading') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// Don't render anything if user is authenticated (they'll be redirected)
	if (status === 'authenticated') {
		return null;
	}
	return (
		<div className="min-h-screen w-full bg-gray-50 flex flex-col">
			{/* Back to Home Link */}
			<div className="px-6 lg:px-12 py-8">
				<Link href="/" className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors">
					<ArrowLeft className="w-5 h-5" />
					<span className="text-lg font-medium">Back To Home</span>
				</Link>
			</div>

			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center px-6 py-12">
				<div className="max-w-6xl w-full">
					{/* Heading */}
					<div className="text-center mb-16">
						<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Welcome to Family Tree</h1>
						<p className="text-lg text-gray-600">Choose how you&apos;d like to access your family tree</p>
					</div>

					{/* Two Cards */}
					<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
						{/* Card 1: Create or Sign In */}
						<div className="bg-white rounded-3xl border-2 border-gray-200 p-8 flex flex-col items-center">
							{/* Icon */}
							<div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
								<User className="w-10 h-10 text-gray-900" strokeWidth={2} />
							</div>

							{/* Title */}
							<h2 className="text-2xl font-semibold text-gray-900 mb-8">Create or Sign In to Account</h2>

							{/* Buttons */}
							<div className="w-full space-y-3">
								<Link href="/welcome/login" className="block">
									<RippleButton
										className="w-full bg-gray-900 text-white hover:bg-gray-800 border-0 text-base py-6 rounded-full"
										variant="default"
									>
										Sign In
										<ChevronRight className="w-5 h-5 ml-2" />
									</RippleButton>
								</Link>
								<Link href="/signup" className="block">
									<RippleButton
										variant="outline"
										className="w-full bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 text-base py-6 rounded-full"
									>
										Create Account
									</RippleButton>
								</Link>
							</div>
						</div>

						{/* Card 2: Access with Code */}
						<div className="bg-white rounded-3xl border-2 border-gray-200 p-8 flex flex-col items-center">
							{/* Icon */}
							<div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
								<KeyRound className="w-10 h-10 text-gray-900" strokeWidth={2} />
							</div>

							{/* Title */}
							<h2 className="text-2xl font-semibold text-gray-900 mb-4">Access with Code</h2>

							{/* Description */}
							<p className="text-center text-gray-600 mb-8 leading-relaxed">
								Have an access code from your family tree owner? Enter it here to view the family tree.
							</p>

							{/* Button */}
							<div className="w-full">
								<Link href="/welcome/guest-login" className="block">
									<RippleButton
										className="w-full bg-gray-900 text-white hover:bg-gray-800 border-0 text-base py-6 rounded-full"
										variant="default"
									>
										Enter Access Code
										<ChevronRight className="w-5 h-5 ml-2" />
									</RippleButton>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

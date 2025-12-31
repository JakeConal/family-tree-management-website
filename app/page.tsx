'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, Users, Award, BarChart3 } from 'lucide-react';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { RippleButton } from '@/components/ui/ripple-button';
import { GradientText } from '@/components/ui/gradient-text';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';

export default function Home() {
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
			<div className="min-h-screen flex items-center justify-center bg-white">
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
		<div className="min-h-screen w-full relative bg-white">
			<div className="relative z-10 min-h-screen w-full">
				{/* Navigation */}
				<nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
					<div className="max-w-7xl mx-auto px-6 lg:px-8">
						<div className="flex justify-between items-center h-16">
							<div className="flex items-center gap-2">
								<Image src="/images/logo.png" alt="Family Tree Logo" width={24} height={24} className="w-6 h-6" />
								<span className="text-lg font-semibold text-gray-900">Family Tree</span>
							</div>
							<div className="hidden md:flex items-center gap-8">
								<a href="#features" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
									Features
								</a>
								<a href="#how-it-works" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
									How It Works
								</a>
							</div>
							<div className="flex items-center gap-3">
								<Link href="/welcome">
									<RippleButton
										variant="outline"
										size="sm"
										className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
									>
										Sign in
									</RippleButton>
								</Link>
								<Link href="/signup">
									<RippleButton
										size="sm"
										className="bg-gray-900 text-white hover:bg-gray-800 border-0"
										variant="default"
									>
										Start for free
									</RippleButton>
								</Link>
							</div>
						</div>
					</div>
				</nav>

				{/* Hero Section */}
				<section className="pt-32 pb-16 px-6 lg:px-8 relative flex flex-col items-center justify-center overflow-hidden">
					<InteractiveGridPattern className="absolute inset-0 w-full h-full opacity-40" width={70} height={70} />
					<div className="max-w-4xl mx-auto relative z-10">
						<div className="text-center mb-8">
							<div className="inline-block mb-6">
								<span className="px-4 py-2 text-sm border border-gray-400 rounded-full bg-white/50 backdrop-blur-sm">
									<GradientText text="Build Your Family Legacy Today" className="font-medium" />
								</span>
							</div>
							<TextGenerateEffect
								words="Preserve Your Family Story"
								className="text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-6 leading-tight"
							/>
							<p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
								Easily build, view, and preserve your family tree for future generations. Connect with your roots and
								celebrate your family&apos;s unique journey.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="/signup">
									<RippleButton
										size="lg"
										className="bg-gray-900 text-white hover:bg-gray-800 border-0"
										variant="default"
									>
										Start for free
									</RippleButton>
								</Link>
								<a href="#features">
									<RippleButton
										variant="outline"
										size="lg"
										className="text-gray-900 bg-white border-gray-300 hover:bg-gray-50"
									>
										Explore
									</RippleButton>
								</a>
							</div>
						</div>

						{/* Dashboard Preview */}
						<div className="mt-12 relative">
							<div className="rounded-xl shadow-2xl overflow-hidden border-8 border-gray-200 bg-white">
								<div className="bg-purple-900 px-4 py-3 flex items-center gap-2">
									<div className="flex gap-1.5">
										<div className="w-3 h-3 rounded-full bg-red-500"></div>
										<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
										<div className="w-3 h-3 rounded-full bg-green-500"></div>
									</div>
								</div>
								<div className="aspect-video bg-white">
									<Image
										src="/images/Family Tree.png"
										alt="Family Tree Dashboard"
										width={1200}
										height={675}
										className="w-full h-full object-cover"
										priority
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section id="features" className="py-20 px-6 lg:px-8 bg-gray-50 relative">
					<div className="max-w-7xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Features</h2>
							<TextGenerateEffect
								words="Powerful tools for family storytelling"
								className="text-4xl md:text-5xl text-gray-900 mb-4"
							/>
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">
								Explore the comprehensive features of our family tree platform
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-6 mb-20">
							{/* Dashboard */}
							<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
								<div className="aspect-4/3 bg-gray-100">
									<Image
										src="/images/Dashboard.png"
										alt="Dashboard"
										width={400}
										height={300}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="p-6">
									<h4 className="text-xl font-bold text-gray-900 mb-2">Dashboard</h4>
									<p className="text-gray-600">Get a clear overview of all your key insights in one place</p>
								</div>
							</div>

							{/* Achievement List */}
							<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
								<div className="aspect-4/3 bg-gray-100">
									<Image
										src="/images/Achievement List.png"
										alt="Achievement List"
										width={400}
										height={300}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="p-6">
									<h4 className="text-xl font-bold text-gray-900 mb-2">Achievement List</h4>
									<p className="text-gray-600">Track your achievements with detailed, organized records</p>
								</div>
							</div>

							{/* Report */}
							<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
								<div className="aspect-4/3 bg-gray-100">
									<Image
										src="/images/Report.png"
										alt="Report"
										width={400}
										height={300}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="p-6">
									<h4 className="text-xl font-bold text-gray-900 mb-2">Report</h4>
									<p className="text-gray-600">Visualize your progress through analytic, easy-to-read charts</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Additional Features Section */}
				<section className="py-20 px-6 lg:px-8 bg-white">
					<div className="max-w-7xl mx-auto">
						<div className="grid lg:grid-cols-2 gap-12 items-start">
							{/* Left: Title */}
							<div>
								<h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
									Additional Features
								</h2>
								<TextGenerateEffect
									words="Weave the tapestry of your family's enduring story"
									className="text-3xl md:text-4xl text-gray-900"
								/>
							</div>

							{/* Right: Feature List */}
							<div className="space-y-10">
								{/* Interactive Family Tree */}
								<div className="flex gap-4 items-start">
									<div className="shrink-0">
										<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
											<Eye className="w-6 h-6 text-gray-900" />
										</div>
									</div>
									<div className="flex-1">
										<h4 className="text-xl font-bold text-gray-900 mb-2">Interactive Family Tree</h4>
										<p className="text-gray-600 leading-relaxed">
											Visualize your family connections with beautiful, easy-to-navigate tree diagrams.
										</p>
									</div>
								</div>

								{/* Member Management */}
								<div className="flex gap-4 items-start">
									<div className="shrink-0">
										<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
											<Users className="w-6 h-6 text-gray-900" />
										</div>
									</div>
									<div className="flex-1">
										<h4 className="text-xl font-bold text-gray-900 mb-2">Member Management</h4>
										<p className="text-gray-600 leading-relaxed">
											Add and organize family members with detailed profiles and photos.
										</p>
									</div>
								</div>

								{/* Achievement Tracking */}
								<div className="flex gap-4 items-start">
									<div className="shrink-0">
										<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
											<Award className="w-6 h-6 text-gray-900" />
										</div>
									</div>
									<div className="flex-1">
										<h4 className="text-xl font-bold text-gray-900 mb-2">Achievement Tracking</h4>
										<p className="text-gray-600 leading-relaxed">
											Record and celebrate important milestones in your family.
										</p>
									</div>
								</div>

								{/* Detailed Reports */}
								<div className="flex gap-4 items-start">
									<div className="shrink-0">
										<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
											<BarChart3 className="w-6 h-6 text-gray-900" />
										</div>
									</div>
									<div className="flex-1">
										<h4 className="text-xl font-bold text-gray-900 mb-2">Detailed Reports</h4>
										<p className="text-gray-600 leading-relaxed">
											Generate comprehensive reports and statistics about your family history.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* How It Works Section */}
				<section id="how-it-works" className="py-20 px-6 lg:px-8 bg-gray-50 relative">
					<div className="max-w-7xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">How It Works</h2>
							<TextGenerateEffect words="Simple & Fast" className="text-4xl md:text-5xl text-gray-900 mb-4" />
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">Just a steps to start building your family tree</p>
						</div>

						<div className="grid lg:grid-cols-2 gap-12 items-center">
							{/* Form Preview */}
							<div className="order-2 lg:order-1">
								<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
									<Image
										src="/images/Add Member Form - 1.png"
										alt="Add Member Form"
										width={600}
										height={800}
										className="w-full h-auto"
									/>
								</div>
							</div>

							{/* Steps */}
							<div className="order-1 lg:order-2 space-y-8">
								<div>
									<div className="text-4xl font-bold text-gray-900 mb-2">01</div>
									<h4 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h4>
									<p className="text-gray-600 leading-relaxed">Sign up for free in just a few seconds.</p>
								</div>

								<div>
									<div className="text-4xl font-bold text-gray-900 mb-2">02</div>
									<h4 className="text-2xl font-bold text-gray-900 mb-2">Add Member</h4>
									<p className="text-gray-600 leading-relaxed">Enter information about your family members.</p>
								</div>

								<div>
									<div className="text-4xl font-bold text-gray-900 mb-2">03</div>
									<h4 className="text-2xl font-bold text-gray-900 mb-2">Build Connections</h4>
									<p className="text-gray-600 leading-relaxed">Link relationships to build your family tree.</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-20 px-6 lg:px-8 relative ">
					<InteractiveGridPattern
						className="absolute inset-0 opacity-15 -z-10"
						width={50}
						height={50}
						squares={[60, 60]}
					/>
					<div className="max-w-4xl mx-auto text-center">
						<TextGenerateEffect words="Your Family Story Awaits" className="text-4xl md:text-5xl text-gray-900 mb-4" />
						<p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
							Start documenting your family&apos;s unique journey today and create a lasting legacy
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/signup">
								<RippleButton size="lg" className="bg-gray-900 text-white hover:bg-gray-800 border-0" variant="default">
									Start for free
								</RippleButton>
							</Link>
							<Link href="/welcome">
								<RippleButton
									variant="outline"
									size="lg"
									className="text-gray-900 bg-white border-gray-300 hover:bg-gray-50"
								>
									Sign in
								</RippleButton>
							</Link>
						</div>
					</div>
				</section>

				{/* Footer */}
				<footer className="bg-white border-t border-gray-200 py-12 px-6 lg:px-8">
					<div className="max-w-7xl mx-auto">
						<div className="grid md:grid-cols-5 gap-8 mb-8">
							<div className="md:col-span-2">
								<div className="flex items-center gap-2 mb-4">
									<Image src="/images/logo.png" alt="Family Tree Logo" width={24} height={24} className="w-6 h-6" />
									<span className="text-lg font-bold text-gray-900">Family Tree</span>
								</div>
								<p className="text-sm text-gray-600 mb-4 leading-relaxed">Preserve Your Legacy</p>
								<p className="text-sm text-gray-600 leading-relaxed">
									Family Tree helps you build, visualize, and preserve your family tree for future generations. Legacy
									tools designed to help you connect with your roots and celebrate your family&apos;s unique journey.
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
								<ul className="space-y-2 text-sm">
									<li>
										<a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
											Home
										</a>
									</li>
									<li>
										<a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
											Guide
										</a>
									</li>
									<li>
										<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
											FAQ
										</a>
									</li>
								</ul>
							</div>

							<div>
								<h4 className="font-semibold text-gray-900 mb-4 text-sm">Features</h4>
								<ul className="space-y-2 text-sm">
									<li>
										<a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
											Member
										</a>
									</li>
									<li>
										<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
											Blog
										</a>
									</li>
								</ul>
							</div>

							<div>
								<h4 className="font-semibold text-gray-900 mb-4 text-sm">About</h4>
								<ul className="space-y-2 text-sm">
									<li>
										<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
											Contact
										</a>
									</li>
									<li>
										<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
											Community
										</a>
									</li>
								</ul>
							</div>
						</div>

						<div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
							<p className="text-sm text-gray-600">&copy; 2025 Family Tree Management. All rights reserved.</p>
							<div className="flex gap-6 text-sm">
								<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
									Privacy policy
								</a>
								<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
									Cookie policy
								</a>
								<a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
									Terms of service
								</a>
							</div>
						</div>
					</div>
				</footer>
			</div>
		</div>
	);
}

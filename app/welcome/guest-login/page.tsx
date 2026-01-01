'use client';

import { ChevronLeft, KeyRound, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { RippleButton } from '@/components/ui/ripple-button';

export default function GuestLoginPage() {
	const [accessCode, setAccessCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			// First validate the access code with our API
			const response = await fetch('/api/auth/guest', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ accessCode }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || 'Mã truy cập không hợp lệ');
				setIsLoading(false);
				return;
			}

			// If validation succeeds, sign in with NextAuth
			const result = await signIn('guest', {
				accessCode,
				redirect: false,
			});

			if (result?.error) {
				setError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
				setIsLoading(false);
				return;
			}

			// Success - redirect to family tree
			toast.success(`Chào mừng ${data.guestInfo.memberName}!`);
			router.push(data.redirectUrl);
		} catch (error) {
			console.error('Error during guest login:', error);
			setError('Đã xảy ra lỗi. Vui lòng thử lại.');
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-6 py-12">
			<div className="w-full max-w-md">
				{/* Card Container */}
				<div className="bg-white rounded-3xl border-2 border-gray-200 p-8 md:p-10">
					{/* Back Button */}
					<Link
						href="/welcome"
						className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors mb-8"
					>
						<ChevronLeft className="w-5 h-5" />
						<span className="text-sm font-medium">Back</span>
					</Link>

					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Access Code</h1>
						<p className="text-base text-gray-600 leading-relaxed">Enter the code provided by your family tree owner</p>
						{error && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Access Code Field */}
						<div>
							<label htmlFor="accessCode" className="block text-sm font-medium text-gray-900 mb-2">
								Access Code
							</label>
							<div className="relative">
								<KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									id="accessCode"
									type="text"
									value={accessCode}
									onChange={(e) => setAccessCode(e.target.value)}
									placeholder="Enter your 45-character access code"
									className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
									required
									maxLength={45}
									disabled={isLoading}
								/>
							</div>
							<p className="text-sm text-gray-500 mt-2 text-center">The code is exactly 45 characters long</p>
						</div>

						{/* Submit Button */}
						<div className="pt-2">
							<RippleButton
								type="submit"
								className="w-full bg-gray-900 text-white hover:bg-gray-800 border-0 text-base py-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
								variant="default"
								disabled={isLoading}
							>
								{isLoading ? 'Verifying...' : 'Access Family Tree'}
								{!isLoading && <ChevronRight className="w-5 h-5 ml-2" />}
							</RippleButton>
						</div>
					</form>

					{/* Help Text */}
					<div className="mt-8 pt-6 border-t border-gray-200">
						<p className="text-center text-sm text-gray-600 leading-relaxed">
							Don&apos;t have an access code?
							<br />
							Contact your family tree owner to get one.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/modals/ConfirmModal';

export default function AccountSettings() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [updatingPassword, setUpdatingPassword] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Form state
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');

	// Password state
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');

	// Load user data
	useEffect(() => {
		if (session?.user) {
			setFullName(session.user.name || '');
			setEmail(session.user.email || '');
		}
	}, [session]);

	// Redirect if not authenticated
	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/welcome/login');
		}
	}, [status, router]);

	const handleSaveChanges = async () => {
		if (!fullName.trim()) {
			toast.error('Full name is required');
			return;
		}

		if (!email.trim()) {
			toast.error('Email is required');
			return;
		}

		setSaving(true);
		try {
			// TODO: Implement API endpoint to update user account
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success('Account updated successfully!');
		} catch (error) {
			console.error('Error updating account:', error);
			toast.error('Failed to update account. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const handleUpdatePassword = async () => {
		if (!currentPassword.trim()) {
			toast.error('Current password is required');
			return;
		}

		if (!newPassword.trim()) {
			toast.error('New password is required');
			return;
		}

		if (newPassword.length < 8) {
			toast.error('New password must be at least 8 characters');
			return;
		}

		if (newPassword !== confirmNewPassword) {
			toast.error('New passwords do not match');
			return;
		}

		setUpdatingPassword(true);
		try {
			// TODO: Implement API endpoint to update password
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success('Password updated successfully!');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmNewPassword('');
		} catch (error) {
			console.error('Error updating password:', error);
			toast.error('Failed to update password. Please try again.');
		} finally {
			setUpdatingPassword(false);
		}
	};

	const handleDeleteAccount = async () => {
		setDeleting(true);
		try {
			// TODO: Implement API endpoint to delete account
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success('Account deleted successfully');
			router.push('/welcome');
		} catch (error) {
			console.error('Error deleting account:', error);
			toast.error('Failed to delete account. Please try again.');
			setDeleting(false);
			setShowDeleteConfirm(false);
		}
	};

	if (status === 'loading') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<Loader2 className="animate-spin h-12 w-12 text-gray-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto p-4 lg:p-8">
			<div className="max-w-5xl space-y-8">
				{/* Account Information Section */}
				<div className="border-2 border-[rgba(0,0,0,0.30)] rounded-lg p-6">
					<h2 className="font-roboto font-normal text-[23.788px] text-black mb-8">Account Information</h2>

					{/* Full Name Field */}
					<div className="mb-8">
						<label className="block font-inter font-normal text-[21.252px] text-black mb-3">Full Name</label>
						<input
							type="text"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
							placeholder="Enter your full name"
						/>
					</div>

					{/* Email Field */}
					<div className="mb-8">
						<label className="block font-inter font-normal text-[21.252px] text-black mb-3">Email</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
							placeholder="Enter your email"
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4 mt-8">
						<button
							onClick={handleSaveChanges}
							disabled={saving || deleting}
							className="h-10 px-6 bg-[#1f2937] text-white rounded-[10px] font-roboto font-bold text-[14px] hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{saving ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Saving...
								</>
							) : (
								'Save Changes'
							)}
						</button>
						<button
							onClick={() => setShowDeleteConfirm(true)}
							disabled={saving || deleting}
							className="h-10 px-6 bg-[#dc2626] text-white rounded-[10px] font-roboto font-bold text-[14px] hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{deleting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Deleting...
								</>
							) : (
								'Delete Account'
							)}
						</button>
					</div>
				</div>

				{/* Change Password Section */}
				<div className="border-2 border-[rgba(0,0,0,0.30)] rounded-lg p-6">
					<h2 className="font-roboto font-normal text-[23.788px] text-black mb-8">Change Password</h2>

					{/* Current Password Field */}
					<div className="mb-8">
						<label className="block font-inter font-normal text-[21.252px] text-black mb-3">Current Password</label>
						<input
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
							placeholder="Enter current password"
						/>
					</div>

					{/* New Password Field */}
					<div className="mb-8">
						<label className="block font-inter font-normal text-[21.252px] text-black mb-3">New Password</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
							placeholder="Enter new password"
						/>
					</div>

					{/* Confirm New Password Field */}
					<div className="mb-8">
						<label className="block font-inter font-normal text-[21.252px] text-black mb-3">Confirm New Password</label>
						<input
							type="password"
							value={confirmNewPassword}
							onChange={(e) => setConfirmNewPassword(e.target.value)}
							className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
							placeholder="Confirm new password"
						/>
					</div>

					{/* Update Password Button */}
					<div className="mt-8">
						<button
							onClick={handleUpdatePassword}
							disabled={updatingPassword}
							className="h-10 px-6 bg-[#1f2937] text-white rounded-[10px] font-roboto font-bold text-[14px] hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{updatingPassword ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Updating...
								</>
							) : (
								'Update Password'
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<ConfirmModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDeleteAccount}
				title="Delete Account"
				message={`Are you sure you want to delete your account?\n\nThis action cannot be undone and will delete all your family trees, members, and records.`}
				confirmText="Delete"
				cancelText="Cancel"
				confirmButtonClass="bg-red-600 hover:bg-red-700"
				isLoading={deleting}
			/>
		</div>
	);
}

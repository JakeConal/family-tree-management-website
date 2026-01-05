'use client';

import { Check, Copy, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import LoadingScreen from '@/components/LoadingScreen';
import { FamilyMember } from '@/types';

interface InviteGuestModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	familyMembers: FamilyMember[];
}

export default function InviteGuestModal({ isOpen, onClose, familyTreeId, familyMembers }: InviteGuestModalProps) {
	const [selectedMemberId, setSelectedMemberId] = useState<string>('');
	const [accessCode, setAccessCode] = useState<string>('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [copied, setCopied] = useState(false);
	const [expiresAt, setExpiresAt] = useState<string>('');

	const handleGenerate = async () => {
		if (!selectedMemberId) {
			toast.error('Please select a member');
			return;
		}

		setIsGenerating(true);

		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/guest-invites`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					familyMemberId: parseInt(selectedMemberId),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.error(data.error || 'Unable to generate access code');
				setIsGenerating(false);
				return;
			}

			setAccessCode(data.accessCode);
			setExpiresAt(data.expiresAt);
			toast.success('Access code generated successfully!');
		} catch (error) {
			console.error('Error generating access code:', error);
			toast.error('An error occurred while generating code');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(accessCode);
			setCopied(true);
			toast.success('Access code copied!');
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Error copying to clipboard:', error);
			toast.error('Unable to copy');
		}
	};

	const handleClose = () => {
		setSelectedMemberId('');
		setAccessCode('');
		setExpiresAt('');
		setCopied(false);
		onClose();
	};

	const formatExpiryDate = (isoString: string) => {
		const date = new Date(isoString);
		return date.toLocaleString('vi-VN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
				{/* Close button */}
				<button
					onClick={handleClose}
					className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
				>
					<X className="w-5 h-5 text-gray-500" />
				</button>

				{/* Header */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Invite Guest to Edit</h2>
					<p className="text-sm text-gray-600">
						Generate an access code to allow family members to view the family tree and edit their own profile
					</p>
				</div>

				{isGenerating ? (
					<div className="py-8">
						<LoadingScreen message="Generating access code..." />
					</div>
				) : accessCode ? (
					/* Display generated code */
					<div className="space-y-4">
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<p className="text-sm font-medium text-green-800 mb-2">Access code generated!</p>
							<div className="bg-white rounded-lg p-3 font-mono text-sm break-all border border-green-300">
								{accessCode}
							</div>
						</div>

						<button
							onClick={handleCopy}
							className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
						>
							{copied ? (
								<>
									<Check className="w-5 h-5" />
									<span>Copied!</span>
								</>
							) : (
								<>
									<Copy className="w-5 h-5" />
									<span>Copy Code</span>
								</>
							)}
						</button>

						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<p className="text-sm text-yellow-800">
								<strong>Note:</strong> This code will expire after 48 hours
							</p>
							{expiresAt && <p className="text-xs text-yellow-700 mt-1">Expires at: {formatExpiryDate(expiresAt)}</p>}
						</div>

						<button
							onClick={handleClose}
							className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Đóng
						</button>
					</div>
				) : (
					/* Member selection */
					<div className="space-y-4">
						<div>
							<label htmlFor="member-select" className="block text-sm font-medium text-gray-900 mb-2">
								Select Member
							</label>
							<select
								id="member-select"
								value={selectedMemberId}
								onChange={(e) => setSelectedMemberId(e.target.value)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
							>
								<option value="">-- Select Member --</option>
								{familyMembers.map((member) => (
									<option key={member.id} value={member.id}>
										{member.fullName} {member.generation ? `(Generation ${member.generation})` : ''}
									</option>
								))}
							</select>
						</div>

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">
								<strong>Info:</strong> The selected member will be able to view the entire family tree but can only
								edit their own profile.
							</p>
						</div>

						<div className="flex gap-3">
							<button
								onClick={handleClose}
								className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleGenerate}
								disabled={!selectedMemberId}
								className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Generate Code
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

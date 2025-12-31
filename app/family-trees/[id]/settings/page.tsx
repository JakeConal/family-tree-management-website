'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { triggerFamilyTreesRefresh } from '@/lib/useFamilyTrees';
import ConfirmModal from '@/components/modals/ConfirmModal';
import LoadingScreen from '@/components/LoadingScreen';
import { FamilyTreeService } from '@/lib/services';

interface FamilyTree {
	id: number;
	familyName: string;
	origin: string | null;
	establishYear: number | null;
	createdAt: string;
	treeOwnerId: number;
}

export default function FamilyTreeSettings() {
	const router = useRouter();
	const params = useParams();
	const familyTreeId = params.id as string;

	const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Form state
	const [familyName, setFamilyName] = useState('');
	const [origin, setOrigin] = useState('');
	const [establishYear, setEstablishYear] = useState('');

	// Fetch family tree details
	useEffect(() => {
		const fetchFamilyTree = async () => {
			try {
				// const response = await fetch(`/api/family-trees/${familyTreeId}`);
				const data = await FamilyTreeService.getById(familyTreeId);
				setFamilyTree(data);

				// Populate form fields
				setFamilyName(data.familyName || '');
				setOrigin(data.origin || '');
				setEstablishYear(data.establishYear?.toString() || '');
			} catch (error) {
				console.error('Error fetching family tree:', error);
			} finally {
				setLoading(false);
			}
		};

		if (familyTreeId) {
			fetchFamilyTree();
		}
	}, [familyTreeId]);

	const handleSaveChanges = async () => {
		if (!familyTree) return;

		setSaving(true);
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					familyName: familyName.trim(),
					origin: origin.trim() || null,
					establishYear: establishYear ? parseInt(establishYear) : null,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to update family tree');
			}

			const updatedData = await response.json();
			setFamilyTree(updatedData);

			// Trigger sidebar refresh to update family tree name
			triggerFamilyTreesRefresh();

			// Show success message
			toast.success('Family tree updated successfully!');
		} catch (error) {
			console.error('Error updating family tree:', error);
			toast.error('Failed to update family tree. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteFamilyTree = async () => {
		if (!familyTree) return;

		setDeleting(true);
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete family tree');
			}

			// Trigger sidebar refresh to remove deleted tree
			triggerFamilyTreesRefresh();

			toast.success('Family tree deleted successfully');

			// Redirect to dashboard after successful deletion
			setTimeout(() => {
				router.push('/dashboard');
			}, 500);
		} catch (error) {
			console.error('Error deleting family tree:', error);
			toast.error('Failed to delete family tree. Please try again.');
			setDeleting(false);
			setShowDeleteConfirm(false);
		}
	};

	if (loading) {
		return <LoadingScreen message="Loading settings..." />;
	}

	if (!familyTree) {
		return (
			<div className="text-center py-12">
				<div className="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
					<h2 className="text-lg font-semibold text-red-800 mb-2">Family Tree Not Found</h2>
					<p className="text-red-600 mb-4">
						The family tree you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
					</p>
					<button
						onClick={() => router.push('/dashboard')}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Go to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto p-4 lg:p-8">
			<div className="max-w-5xl border-2 border-[rgba(0,0,0,0.30)] rounded-lg p-6">
				{/* Header */}
				<h2 className="font-roboto font-normal text-[23.788px] text-black mb-8">Family Information</h2>

				{/* Family Name Field */}
				<div className="mb-8">
					<label className="block font-inter font-normal text-[21.252px] text-black mb-3">Family Name</label>
					<input
						type="text"
						value={familyName}
						onChange={(e) => setFamilyName(e.target.value)}
						className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
						placeholder="Enter family name"
					/>
				</div>

				{/* Origin Field */}
				<div className="mb-8">
					<label className="block font-inter font-normal text-[21.252px] text-black mb-3">Origin</label>
					<select
						value={origin}
						onChange={(e) => setOrigin(e.target.value)}
						className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
					>
						<option value="">Select place of origin</option>
						<option value="An Giang">An Giang</option>
						<option value="Ba Ria – Vung Tau">Ba Ria – Vung Tau</option>
						<option value="Bac Giang">Bac Giang</option>
						<option value="Bac Ninh">Bac Ninh</option>
						<option value="Binh Duong">Binh Duong</option>
						<option value="Binh Dinh">Binh Dinh</option>
						<option value="Binh Phuoc">Binh Phuoc</option>
						<option value="Binh Thuan">Binh Thuan</option>
						<option value="Ca Mau">Ca Mau</option>
						<option value="Dak Lak">Dak Lak</option>
						<option value="Dak Nong">Dak Nong</option>
						<option value="Dong Nai">Dong Nai</option>
						<option value="Dong Thap">Dong Thap</option>
						<option value="Gia Lai">Gia Lai</option>
						<option value="Ha Giang">Ha Giang</option>
						<option value="Ha Nam">Ha Nam</option>
						<option value="Ha Tinh">Ha Tinh</option>
						<option value="Khanh Hoa">Khanh Hoa</option>
						<option value="Kien Giang">Kien Giang</option>
						<option value="Lam Dong">Lam Dong</option>
						<option value="Lao Cai">Lao Cai</option>
						<option value="Long An">Long An</option>
						<option value="Nam Dinh">Nam Dinh</option>
						<option value="Nghe An">Nghe An</option>
						<option value="Ninh Binh">Ninh Binh</option>
						<option value="Phu Tho">Phu Tho</option>
						<option value="Quang Nam">Quang Nam</option>
						<option value="Hanoi">Hanoi</option>
						<option value="Ho Chi Minh City">Ho Chi Minh City</option>
						<option value="Hai Phong">Hai Phong</option>
						<option value="Da Nang">Da Nang</option>
						<option value="Can Tho">Can Tho</option>
						<option value="Hue">Hue</option>
					</select>
				</div>

				{/* Established Year Field */}
				<div className="mb-8">
					<label className="block font-inter font-normal text-[21.252px] text-black mb-3">Established</label>
					<input
						type="text"
						value={establishYear}
						onChange={(e) => {
							// Only allow numbers
							const value = e.target.value.replace(/[^0-9]/g, '');
							setEstablishYear(value);
						}}
						className="w-full h-[51.02px] bg-[#f3f2f2] border-[1.458px] border-[rgba(0,0,0,0.5)] rounded-[43.731px] px-10 font-roboto text-[17.492px] text-black focus:outline-none focus:border-gray-700"
						placeholder="Enter establishment year"
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
							'Delete Family Tree'
						)}
					</button>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<ConfirmModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDeleteFamilyTree}
				title="Delete Family Tree"
				message={`Are you sure you want to delete "${familyTree?.familyName}"?\n\nThis action cannot be undone and will delete all associated members, relationships, and records.`}
				confirmText="Delete"
				cancelText="Cancel"
				confirmButtonClass="bg-red-600 hover:bg-red-700"
				isLoading={deleting}
			/>
		</div>
	);
}

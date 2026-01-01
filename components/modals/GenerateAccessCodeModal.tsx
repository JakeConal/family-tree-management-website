'use client';

import { Copy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import LoadingScreen from '@/components/LoadingScreen';

interface GenerateAccessCodePanelProps {
	onClose: () => void;
	familyTreeId: string;
	memberId: number;
	memberName: string;
}

export default function GenerateAccessCodePanel({
	onClose,
	familyTreeId,
	memberId,
	memberName,
}: GenerateAccessCodePanelProps) {
	const [accessCode, setAccessCode] = useState<string>('');
	const [isGenerating, setIsGenerating] = useState(false);
	const hasGeneratedRef = useRef(false);
	const isGeneratingRef = useRef(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		// Only generate once when component mounts
		if (hasGeneratedRef.current || isGeneratingRef.current) {
			return;
		}

		hasGeneratedRef.current = true;
		isGeneratingRef.current = true;
		setIsGenerating(true);

		// Create abort controller to cancel request if component unmounts
		abortControllerRef.current = new AbortController();

		const generateAccessCode = async () => {
			try {
				const response = await fetch(`/api/family-trees/${familyTreeId}/guest-invites`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						familyMemberId: memberId,
					}),
					signal: abortControllerRef.current?.signal,
				});

				const data = await response.json();

				if (!response.ok) {
					toast.error(data.error || 'Không thể tạo mã truy cập');
					onClose();
					return;
				}

				setAccessCode(data.accessCode);
				// Show different message based on whether it's a new code or existing one
				if (data.isNew) {
					toast.success('Mã truy cập đã được tạo thành công!');
				} else {
					toast.success('Mã truy cập còn hạn đã được tìm thấy');
				}
			} catch (error: unknown) {
				// Ignore abort errors
				if (error instanceof Error && error.name === 'AbortError') {
					return;
				}
				console.error('Error generating access code:', error);
				toast.error('Đã xảy ra lỗi khi tạo mã');
				onClose();
			} finally {
				setIsGenerating(false);
				isGeneratingRef.current = false;
			}
		};

		generateAccessCode();

		// Cleanup: cancel request if component unmounts
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			hasGeneratedRef.current = false;
			isGeneratingRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty dependency array - only run once on mount

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(accessCode);
			toast.success('Đã sao chép mã truy cập!');
		} catch (error) {
			console.error('Error copying to clipboard:', error);
			toast.error('Không thể sao chép');
		}
	};

	return (
		<div className="h-full flex flex-col bg-white overflow-y-auto">
			{/* Header Section */}
			<div className="px-8 pt-[42px] pb-6">
				{/* Back Button */}
				<button
					onClick={onClose}
					className="flex items-center text-black hover:text-gray-600 transition-colors font-inter text-base mb-[25px]"
					disabled={isGenerating}
				>
					<span className="font-light">&lt;</span>
					<span className="font-normal ml-1">Back</span>
				</button>

				{/* Title */}
				<h2 className="font-roboto font-semibold text-[20px] leading-[28px] text-black mb-[23px]">Share Access</h2>
			</div>

			{/* Content Section */}
			<div className="flex-1 px-8 pb-8">
				{isGenerating ? (
					<div className="flex items-center justify-center h-64">
						<LoadingScreen message="Đang tạo mã truy cập..." />
					</div>
				) : accessCode ? (
					<div className="relative">
						{/* Description */}
						<div className="font-roboto font-normal text-base text-black leading-[24px] mb-[50px]">
							<p className="mb-0">Invite people to this family tree using an Access Code.</p>
							<p>They can view or edit based on the permission you choose below.</p>
						</div>

						{/* Access Code Section */}
						<div className="mb-[24px]">
							<label className="block font-inter font-normal text-base text-black mb-3">Access Code</label>
							<div className="bg-[#f3f2f2] h-[50px] w-full px-4 flex items-center justify-between group relative">
								<span className="font-playfair font-normal text-base text-black absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
									{accessCode}
								</span>
								<button
									onClick={handleCopy}
									className="ml-auto p-2 hover:bg-gray-300 rounded transition-colors opacity-70 group-hover:opacity-100 z-10"
									title="Copy to clipboard"
								>
									<Copy className="w-4 h-4 text-black" />
								</button>
							</div>
							<p className="mt-2 font-roboto font-normal text-xs text-black/60 leading-[16px]">Expires in 48 hours</p>
						</div>

						{/* Permission Note */}
						<div className="mb-8">
							<p className="font-roboto font-normal text-base text-black leading-[24px]">
								Anyone with this code can view entire the family tree and edit only their own personal profile.
							</p>
						</div>

						{/* Done Button - Positioned at bottom right */}
						<div className="flex justify-end">
							<button
								onClick={onClose}
								className="bg-[#1f2937] h-[40px] w-[123px] rounded-[10px] text-white font-roboto font-normal text-sm leading-[20px] hover:bg-[#374151] transition-colors flex items-center justify-center"
							>
								Done
							</button>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

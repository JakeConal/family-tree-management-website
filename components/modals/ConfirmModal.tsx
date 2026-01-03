'use client';

import { X } from 'lucide-react';

interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmButtonClass?: string;
	isLoading?: boolean;
	requirePassword?: boolean;
	password?: string;
	onPasswordChange?: (password: string) => void;
}

export default function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	confirmButtonClass = 'bg-red-600 hover:bg-red-700',
	isLoading = false,
	requirePassword = false,
	password = '',
	onPasswordChange,
}: ConfirmModalProps) {
	if (!isOpen) return null;

	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={!isLoading ? onClose : undefined} />

			{/* Modal */}
			<div className="relative bg-white rounded-[20px] p-6 w-full max-w-md mx-4 shadow-2xl">
				{/* Close button */}
				{!isLoading && (
					<button
						onClick={onClose}
						className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				)}

				{/* Title */}
				<h2 className="text-xl font-bold text-black mb-4 pr-8">{title}</h2>

				{/* Message */}
				<p className="text-gray-700 mb-6 whitespace-pre-line">{message}</p>

				{/* Password Input (if required) */}
				{requirePassword && (
					<div className="mb-6">
						<label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 mb-2">
							Enter your password to confirm
						</label>
						<input
							id="delete-password"
							type="password"
							value={password}
							onChange={(e) => onPasswordChange?.(e.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Your password"
							disabled={isLoading}
						/>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-3 justify-end">
					<button
						onClick={onClose}
						disabled={isLoading}
						className="px-6 py-2 bg-gray-200 text-gray-800 rounded-[10px] font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{cancelText}
					</button>
					<button
						onClick={handleConfirm}
						disabled={isLoading || (requirePassword && !password.trim())}
						className={`px-6 py-2 text-white rounded-[10px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
					>
						{isLoading ? 'Processing...' : confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}

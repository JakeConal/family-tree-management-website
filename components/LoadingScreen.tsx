interface LoadingScreenProps {
	message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
				<p className="text-gray-600">{message}</p>
			</div>
		</div>
	);
}

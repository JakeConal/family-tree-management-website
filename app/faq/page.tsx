'use client';

import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

export default function FAQ() {
	const faqs = [
		{
			question: 'What is Family Tree Management?',
			answer:
				'Family Tree Management is a comprehensive platform that helps you build, visualize, and preserve your family tree for future generations. It provides tools to add family members, create relationships, track achievements, and generate detailed reports.',
		},
		{
			question: 'How do I get started?',
			answer:
				'Getting started is easy! Simply sign up for a free account, add your immediate family members, and start building connections. Our intuitive interface guides you through each step of creating your family tree.',
		},
		{
			question: 'Is my family data secure?',
			answer:
				'Yes, we take data security very seriously. All your family information is encrypted and stored securely. You have full control over who can view your family tree through our privacy settings.',
		},
		{
			question: 'Can I share my family tree with others?',
			answer:
				'Absolutely! You can generate access codes to share your family tree with relatives, or make it publicly viewable. We also offer guest editing capabilities for collaborative family tree building.',
		},
		{
			question: 'What features are included in the free plan?',
			answer:
				'Our free plan includes unlimited family members, basic tree visualization, achievement tracking, and the ability to generate reports. Premium features include advanced analytics and export options.',
		},
		{
			question: 'How do I add photos and documents?',
			answer:
				"You can upload photos and documents directly to each family member's profile. We support various file formats and store them securely in the cloud.",
		},
		{
			question: 'Can I export my family tree data?',
			answer:
				'Yes, premium users can export their family tree data in various formats including PDF reports, GEDCOM files, and image formats for sharing or backup purposes.',
		},
		{
			question: 'Is there a mobile app?',
			answer:
				'Currently, Family Tree Management is available as a web application that works seamlessly on all devices including mobile phones and tablets through your browser.',
		},
	];

	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-4xl mx-auto px-6 py-16">
				<div className="mb-8">
					<Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
						← Back to Home
					</Link>
				</div>

				<h1 className="text-4xl font-bold text-gray-900 mb-8">
					<FormattedMessage id="faq.title" defaultMessage="Frequently Asked Questions" />
				</h1>

				<div className="space-y-6">
					{faqs.map((faq, index) => (
						<div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
							<h3 className="text-xl font-semibold text-gray-900 mb-3">{faq.question}</h3>
							<p className="text-gray-700 leading-relaxed">{faq.answer}</p>
						</div>
					))}
				</div>

				<div className="mt-12 p-6 bg-gray-50 rounded-lg">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						<FormattedMessage id="faq.contact.title" defaultMessage="Still have questions?" />
					</h3>
					<p className="text-gray-700 mb-4">
						<FormattedMessage
							id="faq.contact.description"
							defaultMessage="Can't find the answer you're looking for? Our support team is here to help."
						/>
					</p>
					<Link
						href="/contact"
						className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
					>
						<FormattedMessage id="faq.contact.button" defaultMessage="Contact Support" />
					</Link>
				</div>
			</div>
		</div>
	);
}

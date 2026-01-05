'use client';

import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

export default function PrivacyPolicy() {
	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-4xl mx-auto px-6 py-16">
				<div className="mb-8">
					<Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
						← Back to Home
					</Link>
				</div>

				<h1 className="text-4xl font-bold text-gray-900 mb-8">
					<FormattedMessage id="privacy.title" defaultMessage="Privacy Policy" />
				</h1>

				<div className="prose prose-gray max-w-none">
					<p className="text-gray-600 mb-6">
						<FormattedMessage
							id="privacy.lastUpdated"
							defaultMessage="Last updated: January 5, 2026"
						/>
					</p>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.introduction.title" defaultMessage="Introduction" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.introduction.content"
								defaultMessage="Family Tree Management ('we', 'our', or 'us') is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our family tree management platform."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.information.title" defaultMessage="Information We Collect" />
						</h2>
						<h3 className="text-xl font-medium text-gray-900 mb-2">
							<FormattedMessage id="privacy.personalInfo.title" defaultMessage="Personal Information" />
						</h3>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.personalInfo.content"
								defaultMessage="We collect information you provide directly to us, such as when you create an account, add family members, or contact us for support. This may include your name, email address, and any personal information about family members you choose to share."
							/>
						</p>

						<h3 className="text-xl font-medium text-gray-900 mb-2">
							<FormattedMessage id="privacy.usageData.title" defaultMessage="Usage Data" />
						</h3>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.usageData.content"
								defaultMessage="We automatically collect certain information about your device and how you interact with our platform, including IP address, browser type, pages visited, and time spent on our site."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.use.title" defaultMessage="How We Use Your Information" />
						</h2>
						<ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
							<li>
								<FormattedMessage
									id="privacy.use.1"
									defaultMessage="To provide and maintain our family tree management services"
								/>
							</li>
							<li>
								<FormattedMessage
									id="privacy.use.2"
									defaultMessage="To communicate with you about your account and our services"
								/>
							</li>
							<li>
								<FormattedMessage
									id="privacy.use.3"
									defaultMessage="To improve our platform and develop new features"
								/>
							</li>
							<li>
								<FormattedMessage
									id="privacy.use.4"
									defaultMessage="To ensure the security and integrity of our services"
								/>
							</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.sharing.title" defaultMessage="Information Sharing" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.sharing.content"
								defaultMessage="We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information in the following circumstances:"
							/>
						</p>
						<ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
							<li>
								<FormattedMessage
									id="privacy.sharing.1"
									defaultMessage="With service providers who assist us in operating our platform"
								/>
							</li>
							<li>
								<FormattedMessage
									id="privacy.sharing.2"
									defaultMessage="When required by law or to protect our rights"
								/>
							</li>
							<li>
								<FormattedMessage
									id="privacy.sharing.3"
									defaultMessage="In connection with a business transfer or merger"
								/>
							</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.security.title" defaultMessage="Data Security" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.security.content"
								defaultMessage="We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.rights.title" defaultMessage="Your Rights" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.rights.content"
								defaultMessage="Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, delete, or restrict processing of your data. To exercise these rights, please contact us."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.cookies.title" defaultMessage="Cookies" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.cookies.content"
								defaultMessage="We use cookies and similar technologies to enhance your experience on our platform. For more detailed information about our use of cookies, please see our Cookie Policy."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.changes.title" defaultMessage="Changes to This Policy" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.changes.content"
								defaultMessage="We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'Last updated' date."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="privacy.contact.title" defaultMessage="Contact Us" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="privacy.contact.content"
								defaultMessage="If you have any questions about this Privacy Policy, please contact us at privacy@familytree.com."
							/>
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}

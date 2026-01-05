'use client';

import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

export default function TermsOfService() {
	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-4xl mx-auto px-6 py-16">
				<div className="mb-8">
					<Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
						← Back to Home
					</Link>
				</div>

				<h1 className="text-4xl font-bold text-gray-900 mb-8">
					<FormattedMessage id="terms.title" defaultMessage="Terms of Service" />
				</h1>

				<div className="prose prose-gray max-w-none">
					<p className="text-gray-600 mb-6">
						<FormattedMessage
							id="terms.lastUpdated"
							defaultMessage="Last updated: January 5, 2026"
						/>
					</p>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.acceptance.title" defaultMessage="Acceptance of Terms" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.acceptance.content"
								defaultMessage="By accessing and using Family Tree Management ('the Service'), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.description.title" defaultMessage="Description of Service" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.description.content"
								defaultMessage="Family Tree Management provides a platform for creating, managing, and sharing family trees. Our service includes tools for adding family members, building relationships, tracking achievements, and generating reports."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.accounts.title" defaultMessage="User Accounts" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.accounts.content"
								defaultMessage="To use certain features of our service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.content.title" defaultMessage="User Content" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.content.responsibility"
								defaultMessage="You are solely responsible for the content you upload, post, or share through our service. You retain ownership of your content, but you grant us a license to use, store, and display it as necessary to provide our services."
							/>
						</p>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.content.guidelines"
								defaultMessage="You agree not to upload content that is illegal, harmful, offensive, or violates the rights of others. We reserve the right to remove any content that violates these terms."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.privacy.title" defaultMessage="Privacy" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.privacy.content"
								defaultMessage="Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.prohibited.title" defaultMessage="Prohibited Uses" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.prohibited.content"
								defaultMessage="You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts. This includes, but is not limited to:"
							/>
						</p>
						<ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
							<li>
								<FormattedMessage
									id="terms.prohibited.1"
									defaultMessage="Violating any applicable laws or regulations"
								/>
							</li>
							<li>
								<FormattedMessage
									id="terms.prohibited.2"
									defaultMessage="Infringing on intellectual property rights"
								/>
							</li>
							<li>
								<FormattedMessage
									id="terms.prohibited.3"
									defaultMessage="Harassing, abusing, or harming others"
								/>
							</li>
							<li>
								<FormattedMessage
									id="terms.prohibited.4"
									defaultMessage="Attempting to gain unauthorized access to our systems"
								/>
							</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.termination.title" defaultMessage="Termination" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.termination.content"
								defaultMessage="We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these Terms."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.disclaimer.title" defaultMessage="Disclaimer" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.disclaimer.content"
								defaultMessage="The service is provided on an 'as is' and 'as available' basis. We make no warranties, expressed or implied, and hereby disclaim all warranties including merchantability, fitness for a particular purpose, and non-infringement."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.limitation.title" defaultMessage="Limitation of Liability" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.limitation.content"
								defaultMessage="In no event shall Family Tree Management be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.changes.title" defaultMessage="Changes to Terms" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.changes.content"
								defaultMessage="We reserve the right to modify these terms at any time. We will notify users of any changes by updating the 'Last updated' date and posting the new terms on this page."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="terms.contact.title" defaultMessage="Contact Information" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="terms.contact.content"
								defaultMessage="If you have any questions about these Terms of Service, please contact us at legal@familytree.com."
							/>
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}

'use client';

import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

export default function CookiePolicy() {
	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-4xl mx-auto px-6 py-16">
				<div className="mb-8">
					<Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
						← Back to Home
					</Link>
				</div>

				<h1 className="text-4xl font-bold text-gray-900 mb-8">
					<FormattedMessage id="cookie.title" defaultMessage="Cookie Policy" />
				</h1>

				<div className="prose prose-gray max-w-none">
					<p className="text-gray-600 mb-6">
						<FormattedMessage
							id="cookie.lastUpdated"
							defaultMessage="Last updated: January 5, 2026"
						/>
					</p>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="cookie.what.title" defaultMessage="What Are Cookies" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.what.content"
								defaultMessage="Cookies are small text files that are stored on your computer or mobile device when you visit our website. They help us provide you with a better browsing experience by remembering your preferences and understanding how you use our site."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="cookie.types.title" defaultMessage="Types of Cookies We Use" />
						</h2>

						<h3 className="text-xl font-medium text-gray-900 mb-2">
							<FormattedMessage id="cookie.essential.title" defaultMessage="Essential Cookies" />
						</h3>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.essential.content"
								defaultMessage="These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt out of these cookies."
							/>
						</p>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.auth.content"
								defaultMessage="We use NextAuth.js for authentication, which sets essential cookies to maintain your login session and ensure secure access to your account. These include session tokens, CSRF protection tokens, and callback URL storage."
							/>
						</p>

						<h3 className="text-xl font-medium text-gray-900 mb-2">
							<FormattedMessage id="cookie.analytics.title" defaultMessage="Analytics Cookies" />
						</h3>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.analytics.content"
								defaultMessage="These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website's performance."
							/>
						</p>

						<h3 className="text-xl font-medium text-gray-900 mb-2">
							<FormattedMessage id="cookie.functional.title" defaultMessage="Functional Cookies" />
						</h3>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.functional.content"
								defaultMessage="These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="cookie.thirdParty.title" defaultMessage="Third-Party Cookies" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.thirdParty.content"
								defaultMessage="Some cookies may be set by third-party services that appear on our pages. We have no control over these cookies, and they are subject to the respective third party's privacy policy."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="cookie.manage.title" defaultMessage="Managing Cookies" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.manage.content"
								defaultMessage="You can control and manage cookies in various ways. Most web browsers automatically accept cookies, but you can modify your browser settings to decline cookies if you prefer. However, this may prevent you from taking full advantage of the website."
							/>
						</p>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.manage.browsers"
								defaultMessage="You can usually find cookie settings in the 'Options' or 'Preferences' menu of your browser. You can also visit www.allaboutcookies.org for more information."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="cookie.changes.title" defaultMessage="Changes to This Policy" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.changes.content"
								defaultMessage="We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page."
							/>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							<FormattedMessage id="cookie.contact.title" defaultMessage="Contact Us" />
						</h2>
						<p className="text-gray-700 leading-relaxed mb-4">
							<FormattedMessage
								id="cookie.contact.content"
								defaultMessage="If you have any questions about our use of cookies, please contact us at privacy@familytree.com."
							/>
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}

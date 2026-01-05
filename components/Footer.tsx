import Image from 'next/image';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

export default function Footer() {
	return (
		<footer className="bg-white border-t border-gray-200 py-12 px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="grid md:grid-cols-4 gap-8 mb-8">
					<div className="md:col-span-2">
						<div className="flex items-center gap-2 mb-4">
							<Image src="/images/logo.png" alt="Family Tree Logo" width={24} height={24} className="w-6 h-6" />
							<span className="text-lg font-bold text-gray-900">
								<FormattedMessage id="nav.familyTree" defaultMessage="Family Tree" />
							</span>
						</div>
						<p className="text-sm text-gray-600 mb-4 leading-relaxed">
							<FormattedMessage id="home.footer.tagline" defaultMessage="Preserve Your Legacy" />
						</p>
						<p className="text-sm text-gray-600 leading-relaxed">
							<FormattedMessage
								id="home.footer.description"
								defaultMessage="Family Tree helps you build, visualize, and preserve your family tree for future generations. Legacy tools designed to help you connect with your roots and celebrate your family's unique journey."
							/>
						</p>
					</div>

					<div>
						<h4 className="font-semibold text-gray-900 mb-4 text-sm">
							<FormattedMessage id="home.footer.about.title" defaultMessage="About" />
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
									<FormattedMessage id="home.footer.about.contact" defaultMessage="Contact" />
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="font-semibold text-gray-900 mb-4 text-sm">
							<FormattedMessage id="home.footer.product.title" defaultMessage="Product" />
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
									<FormattedMessage id="home.footer.product.home" defaultMessage="Home" />
								</a>
							</li>
							<li>
								<a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
									<FormattedMessage id="home.footer.product.guide" defaultMessage="Guide" />
								</a>
							</li>
							<li>
								<Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">
									<FormattedMessage id="home.footer.product.faq" defaultMessage="FAQ" />
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-sm text-gray-600">
						<FormattedMessage
							id="home.footer.copyright"
							defaultMessage="© 2025 Family Tree Management. All rights reserved."
						/>
					</p>
					<div className="flex gap-6 text-sm">
						<Link href="/privacy-policy" className="text-gray-600 hover:text-gray-900 transition-colors">
							<FormattedMessage id="home.footer.privacyPolicy" defaultMessage="Privacy policy" />
						</Link>
						<Link href="/cookie-policy" className="text-gray-600 hover:text-gray-900 transition-colors">
							<FormattedMessage id="home.footer.cookiePolicy" defaultMessage="Cookie policy" />
						</Link>
						<Link href="/terms-of-service" className="text-gray-600 hover:text-gray-900 transition-colors">
							<FormattedMessage id="home.footer.termsOfService" defaultMessage="Terms of service" />
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}

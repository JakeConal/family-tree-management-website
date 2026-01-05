'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

export default function Contact() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: ''
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Handle form submission here
		alert('Thank you for your message! We will get back to you soon.');
		setFormData({ name: '', email: '', subject: '', message: '' });
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-6xl mx-auto px-6 py-16">
				<div className="mb-8">
					<Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
						← Back to Home
					</Link>
				</div>

				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						<FormattedMessage id="contact.title" defaultMessage="Contact Us" />
					</h1>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						<FormattedMessage
							id="contact.subtitle"
							defaultMessage="Have questions about Family Tree Management? We're here to help!"
						/>
					</p>
				</div>

				<div className="grid lg:grid-cols-2 gap-12">
					{/* Contact Form */}
					<div>
						<h2 className="text-2xl font-semibold text-gray-900 mb-6">
							<FormattedMessage id="contact.form.title" defaultMessage="Send us a message" />
						</h2>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
									<FormattedMessage id="contact.form.name" defaultMessage="Full Name" />
								</label>
								<input
									type="text"
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Your full name"
								/>
							</div>

							<div>
								<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
									<FormattedMessage id="contact.form.email" defaultMessage="Email Address" />
								</label>
								<input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="your.email@example.com"
								/>
							</div>

							<div>
								<label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
									<FormattedMessage id="contact.form.subject" defaultMessage="Subject" />
								</label>
								<select
									id="subject"
									name="subject"
									value={formData.subject}
									onChange={handleChange}
									required
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">
										<FormattedMessage id="contact.form.subject.placeholder" defaultMessage="Select a subject" />
									</option>
									<option value="general">
										<FormattedMessage id="contact.form.subject.general" defaultMessage="General Inquiry" />
									</option>
									<option value="support">
										<FormattedMessage id="contact.form.subject.support" defaultMessage="Technical Support" />
									</option>
									<option value="billing">
										<FormattedMessage id="contact.form.subject.billing" defaultMessage="Billing & Pricing" />
									</option>
									<option value="partnership">
										<FormattedMessage id="contact.form.subject.partnership" defaultMessage="Partnership Opportunities" />
									</option>
									<option value="other">
										<FormattedMessage id="contact.form.subject.other" defaultMessage="Other" />
									</option>
								</select>
							</div>

							<div>
								<label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
									<FormattedMessage id="contact.form.message" defaultMessage="Message" />
								</label>
								<textarea
									id="message"
									name="message"
									value={formData.message}
									onChange={handleChange}
									required
									rows={6}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
									placeholder="Tell us how we can help you..."
								/>
							</div>

							<button
								type="submit"
								className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
							>
								<FormattedMessage id="contact.form.submit" defaultMessage="Send Message" />
							</button>
						</form>
					</div>

					{/* Contact Information */}
					<div>
						<h2 className="text-2xl font-semibold text-gray-900 mb-6">
							<FormattedMessage id="contact.info.title" defaultMessage="Get in touch" />
						</h2>

						<div className="space-y-6">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-1">
										<FormattedMessage id="contact.info.email.title" defaultMessage="Email" />
									</h3>
									<p className="text-gray-600">
										<FormattedMessage id="contact.info.email.description" defaultMessage="Send us an email and we'll respond within 24 hours." />
									</p>
									<a href="mailto:phamnamanh25@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">
										support@familytree.com
									</a>
								</div>
							</div>



							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 mb-1">
										<FormattedMessage id="contact.info.docs.title" defaultMessage="Documentation" />
									</h3>
									<p className="text-gray-600">
										<FormattedMessage id="contact.info.docs.description" defaultMessage="Find answers in our comprehensive documentation." />
									</p>
									<Link href="/faq" className="text-purple-600 hover:text-purple-800 font-medium">
										<FormattedMessage id="contact.info.docs.link" defaultMessage="View FAQ" />
									</Link>
								</div>
							</div>
						</div>

						<div className="mt-8 p-6 bg-gray-50 rounded-lg">
							<h3 className="font-semibold text-gray-900 mb-2">
								<FormattedMessage id="contact.info.hours.title" defaultMessage="Support Hours" />
							</h3>
							<p className="text-gray-600 text-sm">
								<FormattedMessage id="contact.info.hours.description" defaultMessage="Monday - Friday: 9:00 AM - 6:00 PM EST" />
							</p>
							<p className="text-gray-600 text-sm">
								<FormattedMessage id="contact.info.hours.weekend" defaultMessage="Weekend: 10:00 AM - 4:00 PM EST" />
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

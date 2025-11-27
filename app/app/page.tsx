'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, TreeDeciduous, Award, BarChart3, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const LandingPage = () => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Gradient Spots */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-pink-200/30 rounded-full blur-3xl"></div>
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <TreeDeciduous className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">Family Tree</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition">How It Works</a>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">Sign in</Link>
              <Link href="/register" className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition">
                Start for free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-6 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <span className="text-sm font-medium text-gray-700">Build Your Family Legacy Today</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Preserve Your Family<br />Story
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Easily build, view, and preserve your family tree for future generations.<br />
              Connect with your roots and celebrate your family&apos;s unique journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition font-semibold shadow-lg hover:shadow-xl">
                Start for free
              </Link>
              <a href="#features" className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-50 transition font-semibold border border-gray-200 shadow-sm">
                Explore
              </a>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="relative mt-16">
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-2xl border-4 border-white/20">
                <Image 
                  src="/images/Family Tree.png" 
                  alt="Family Tree Dashboard" 
                  width={1200}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4">Features</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful tools for family storytelling
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore the comprehensive features of our family tree platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative h-56 overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image 
                  src="/images/Dashboard.png" 
                  alt="Dashboard" 
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-500"
                />
              </div>
              <div className="p-6 group-hover:bg-purple-50/50 transition-colors duration-300">
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">Dashboard</h4>
                <p className="text-gray-600">Track your overview of your key insights at one place</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image 
                  src="/images/Achievement List.png" 
                  alt="Achievement List" 
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-500"
                />
              </div>
              <div className="p-6 group-hover:bg-blue-50/50 transition-colors duration-300">
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">Achievement List</h4>
                <p className="text-gray-600">Track your achievements with detailed, organized records</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative h-56 overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100">
                <div className="absolute inset-0 bg-gradient-to-t from-pink-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image 
                  src="/images/Report.png" 
                  alt="Report" 
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-500"
                />
              </div>
              <div className="p-6 group-hover:bg-pink-50/50 transition-colors duration-300">
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors duration-300">Report</h4>
                <p className="text-gray-600">Visualize your progress through analytic, easy-to-read charts</p>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Weave the tapestry of your<br />family&apos;s enduring story
              </h3>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TreeDeciduous className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Interactive Family Tree</h4>
                  <p className="text-gray-600">Visualize your family connections with beautiful, easy-to-navigate tree diagrams.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Member Management</h4>
                  <p className="text-gray-600">Add and manage family members with detailed profiles and photos.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Achievement Tracking</h4>
                  <p className="text-gray-600">Record and celebrate important milestones in your family.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Detailed Reports</h4>
                  <p className="text-gray-600">Generate comprehensive reports and statistics about your family history.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4">How It Works</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple & Fast
            </h3>
            <p className="text-xl text-gray-600">
              Just a steps to start building your family tree
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div 
                className={`flex gap-4 p-6 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeStep === 1 ? 'bg-purple-50 shadow-lg' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveStep(1)}
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    activeStep === 1 ? 'bg-purple-600 text-white scale-110' : 'bg-purple-100 text-purple-600'
                  }`}>
                    01
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Create Account</h4>
                  <p className="text-gray-600">Sign up for free in just a few seconds.</p>
                </div>
              </div>

              <div 
                className={`flex gap-4 p-6 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeStep === 2 ? 'bg-purple-50 shadow-lg' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveStep(2)}
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    activeStep === 2 ? 'bg-purple-600 text-white scale-110' : 'bg-purple-100 text-purple-600'
                  }`}>
                    02
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Add Member</h4>
                  <p className="text-gray-600">Enter information about your family members.</p>
                </div>
              </div>

              <div 
                className={`flex gap-4 p-6 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeStep === 3 ? 'bg-purple-50 shadow-lg' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setActiveStep(3)}
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    activeStep === 3 ? 'bg-purple-600 text-white scale-110' : 'bg-purple-100 text-purple-600'
                  }`}>
                    03
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Build Connections</h4>
                  <p className="text-gray-600">Link relationships to build your family tree.</p>
                </div>
              </div>
            </div>

            <div className="relative h-[500px]">
              {/* Stacked Images */}
              <div className="absolute inset-0">
                {/* Login - Step 1 */}
                <div className={`absolute inset-0 transition-all duration-500 ${
                  activeStep === 1 ? 'opacity-100 translate-y-0 rotate-0 z-30 scale-100' : 'opacity-40 translate-y-8 -rotate-6 z-10 scale-95'
                }`}>
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white h-full">
                    <Image 
                      src="/images/Login - 1.png" 
                      alt="Login" 
                      width={600}
                      height={500}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Add Member Form - Personal Info (Top Half) - Step 2 */}
                <div className={`absolute inset-0 transition-all duration-500 ${
                  activeStep === 2 ? 'opacity-100 translate-y-0 rotate-0 z-30 scale-100' : 'opacity-40 translate-y-4 rotate-3 z-20 scale-95'
                }`}>
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white h-full">
                    <Image 
                      src="/images/Add Member Form - 1.png" 
                      alt="Add Member Personal Information" 
                      width={600}
                      height={500}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>

                {/* Add Member Form - Family Connection (Bottom Half) - Step 3 */}
                <div className={`absolute inset-0 transition-all duration-500 ${
                  activeStep === 3 ? 'opacity-100 translate-y-0 rotate-0 z-30 scale-100' : 'opacity-40 translate-y-12 rotate-6 z-10 scale-95'
                }`}>
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white h-full">
                    <Image 
                      src="/images/Add Member Form - 1.png" 
                      alt="Add Member Family Connection" 
                      width={600}
                      height={500}
                      className="w-full h-full object-cover object-bottom"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your Family Story Awaits
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start documenting your family&apos;s unique journey today and create a lasting legacy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition font-semibold shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2">
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-50 transition font-semibold border border-gray-200 shadow-sm">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TreeDeciduous className="w-8 h-8 text-purple-400" />
                <span className="text-xl font-bold">Family Tree</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">Preserve Your Family Legacy</p>
              <p className="text-gray-500 text-sm">
                Family Tree helps you build, visualize, and preserve your family history with powerful tools designed to celebrate your heritage.
              </p>
            </div>

            <div>
              <h6 className="font-semibold mb-4">Product</h6>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><Link href="/register" className="hover:text-white transition">Start for free</Link></li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold mb-4">Company</h6>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Home</a></li>
                <li><a href="#" className="hover:text-white transition">Guide</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold mb-4">Resources</h6>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Member</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Community</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2024 Family Tree Management. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition">Privacy policy</a>
              <a href="#" className="hover:text-white transition">Cookie settings</a>
              <a href="#" className="hover:text-white transition">Terms of service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
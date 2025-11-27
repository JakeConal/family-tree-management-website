'use client';

import Link from 'next/link';
import { ArrowLeft, User, Key, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Gradient Spots */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 mb-16 transition-colors font-medium text-base group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back To Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Welcome to Family Tree
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            Choose how you&apos;d like to access your family tree
          </p>
        </div>

        {/* Two Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Create or Sign In to Account */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 p-10 lg:p-12 hover:shadow-2xl transition-all duration-300 hover:border-purple-300 hover:-translate-y-1">
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <User className="w-10 h-10 text-purple-600" strokeWidth={2.5} />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-10 text-center">
                Create or Sign In to Account
              </h2>

              {/* Buttons */}
              <div className="w-full space-y-3">
                <Link
                  href="/welcome/login"
                  className="w-full bg-gray-900 text-white py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-base shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/welcome/register"
                  className="w-full bg-white text-gray-900 py-3.5 rounded-full font-semibold border-2 border-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center text-base hover:scale-105"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>

          {/* Access with Code */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 p-10 lg:p-12 hover:shadow-2xl transition-all duration-300 hover:border-blue-300 hover:-translate-y-1">
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Key className="w-10 h-10 text-blue-600" strokeWidth={2.5} />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center">
                Access with Code
              </h2>

              {/* Description */}
              <p className="text-center text-gray-600 mb-10 px-2 text-sm md:text-base leading-relaxed">
                Have an access code from your family tree owner? Enter it here to view the family tree.
              </p>

              {/* Button */}
              <div className="w-full">
                <Link
                  href="/welcome/access-code"
                  className="w-full bg-gray-900 text-white py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-base shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Enter Access Code
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

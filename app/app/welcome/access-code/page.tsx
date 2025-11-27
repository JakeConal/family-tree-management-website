'use client';

import Link from 'next/link';
import { ArrowLeft, Key, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function AccessCodePage() {
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add access code validation logic here
    console.log('Access with code:', accessCode);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Gradient Spots */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          {/* Back Button */}
          <Link 
            href="/welcome" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Code</h1>
            <p className="text-gray-600">
              Enter the code provided by your family tree owner
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Access Code Input */}
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="ENTER YOUR ACCESS CODE"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all uppercase text-center tracking-wider"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                The code is usually 8-12 characters long
              </p>
            </div>

            {/* Access Button */}
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Access Family Tree
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an access code?
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Contact your family tree owner to get one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

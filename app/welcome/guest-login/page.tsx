"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, KeyRound, ChevronRight } from "lucide-react";
import { RippleButton } from "../../../components/ui/ripple-button";

export default function GuestLoginPage() {
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle access code verification logic here
    console.log("Access Code:", accessCode);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 md:p-10">
          {/* Back Button */}
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Access Code
            </h1>
            <p className="text-base text-gray-600 leading-relaxed">
              Enter the code provided by your family tree owner
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Access Code Field */}
            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Access Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="ENTER YOUR ACCESS CODE"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all uppercase tracking-wider"
                  required
                  maxLength={12}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                The code is usually 8-12 characters long
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <RippleButton
                type="submit"
                className="w-full bg-gray-900 text-white hover:bg-gray-800 border-0 text-base py-6 rounded-full"
                variant="default"
              >
                Access Family Tree
                <ChevronRight className="w-5 h-5 ml-2" />
              </RippleButton>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 leading-relaxed">
              Don&apos;t have an access code?
              <br />
              Contact your family tree owner to get one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

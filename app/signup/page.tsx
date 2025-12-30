"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  UserCircle,
  Mail,
  Lock,
  ChevronRight,
} from "lucide-react";
import { RippleButton } from "@/components/ui/ripple-button";

export default function SignUpPage() {
  const { status } = useSession();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is authenticated (they'll be redirected)
  if (status === "authenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sign in the user after successful registration
        await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        router.push("/dashboard");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 md:p-10">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-base text-gray-600">
              Start building your Family Tree
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="yourname"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youremail@email.com"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="yourpassword"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="yourpassword"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <RippleButton
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white hover:bg-gray-800 border-0 text-base py-6 rounded-full disabled:opacity-50"
                variant="default"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </RippleButton>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-300 rounded-full bg-white text-gray-900 hover:bg-gray-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link
              href="/welcome/login"
              className="font-semibold text-gray-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

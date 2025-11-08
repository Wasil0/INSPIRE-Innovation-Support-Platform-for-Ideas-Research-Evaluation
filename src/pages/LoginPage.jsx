import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = { email, password, rememberMe };
    console.log("Login attempt:", formData);
    // TODO: call your API or handle login here
  };

  return (
    <>
      <div className="size-full flex items-center justify-center relative overflow-hidden bg-rose-900">
        {/* Decorative shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-rose-700 rounded-full opacity-20" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-800 rounded-full opacity-35" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-rose-600 rounded-full opacity-20" />

        {/* Login Form */}
        <div className="z-10 w-full max-w-md px-4">
          {/* <LoginForm /> */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-800 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl text-gray-900">Welcome Back</h1>
              <p className="text-gray-600 mt-2">
                Sign in to continue to your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-700" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-rose-700 rounded-xl transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-700" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-rose-700 rounded-xl transition-colors"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-2 border-gray-300"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="#"
                  className="text-sm text-rose-700 hover:text-rose-800 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-rose-800 hover:bg-rose-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

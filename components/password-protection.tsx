"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Code2, Sparkles } from "lucide-react";

interface PasswordProtectionProps {
  onCorrectPassword: () => void;
}

export function PasswordProtection({
  onCorrectPassword,
}: PasswordProtectionProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (password === process.env.NEXT_PUBLIC_PLANNER_PASSWORD) {
        onCorrectPassword();
        sessionStorage.setItem("planner_authenticated", "true");
        toast({
          title: "Welcome back Batman! ✨",
          description: "Let's make today amazing.",
        });
      } else {
        setAttempts((prev) => prev + 1);
        toast({
          title: "Incorrect password",
          description:
            attempts > 1 ? "Need a hint? Contact Arafat." : "Please try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black p-4">
      <div className="max-w-md w-full">
        {/* Card with subtle floating animation */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-800 animate-float">
          <div className="text-center">
            {/* Icon with sparkle effect */}
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 animate-pulse bg-black rounded-xl transform rotate-6"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                <Code2 className="h-8 w-8 text-black dark:text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-black dark:text-white animate-twinkle" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome Back Arafat!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Enter your password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200"
              />
            </div>

            <Button
              type="submit"
              className={`w-full py-2 rounded-xl font-medium transition-all duration-200
                ${
                  isLoading
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    : "bg-black text-white hover:bg-gray-900 shadow-lg hover:shadow-black/20"
                }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "Continue to Planner"
              )}
            </Button>
          </form>

          {attempts > 5 && (
            <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
              Don't Bruteforce MF**!
            </p>
          )}
        </div>
      </div>

      {/* Add some floating style */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        @keyframes twinkle {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

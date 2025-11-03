"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createPageUrl } from '@/lib/utils-router';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  
  // Separate loading states
  const [signupLoading, setSignupLoading] = useState(false);
  const [signinLoading, setSigninLoading] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  // Separate state for signup form
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [signupErrors, setSignupErrors] = useState({});
  
  // Separate state for signin form
  const [signinData, setSigninData] = useState({
    email: '',
    password: ''
  });
  const [signinErrors, setSigninErrors] = useState({});

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  const handleSignupInputChange = (field, value) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    if (signupErrors[field]) {
      setSignupErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSigninInputChange = (field, value) => {
    setSigninData(prev => ({ ...prev, [field]: value }));
    if (signinErrors[field]) {
      setSigninErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateSignup = () => {
    const newErrors = {};
    
    if (!signupData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!signupData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!signupData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setSignupErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignin = () => {
    const newErrors = {};
    
    if (!signinData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signinData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!signinData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setSigninErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;
    
    setSignupLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName
          }
        }
      });
      
      if (error) {
        // Check for specific error messages about existing users
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          showToast('This email is already registered. Please sign in instead or use forgot password.', 'error');
          return;
        }
        throw error;
      }
      
      // Check if user already exists (Supabase returns user even for existing accounts)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        showToast('This email is already registered. Please sign in instead or reset your password.', 'error');
        return;
      }
      
      if (data.user && !data.user.email_confirmed_at) {
        showToast('Account created! Please check your email for a confirmation link.', 'success');
      } else if (data.user) {
        showToast('Account created successfully!', 'success');
        router.push(createPageUrl('Dashboard'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast(error.message || 'Failed to create account', 'error');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignin()) return;
    
    setSigninLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signinData.email,
        password: signinData.password
      });
      
      if (error) throw error;
      
      if (data.user) {
        showToast('Welcome back!', 'success');
        router.push(createPageUrl('Dashboard'));
      }
    } catch (error) {
      console.error('Signin error:', error);
      showToast(error.message || 'Invalid login credentials', 'error');
    } finally {
      setSigninLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    
    setResetLoading(true);
    try {
      // Use environment variable for production, fallback to current origin for development
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${baseUrl}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      showToast('Password reset link sent! Check your email.', 'success');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      showToast(error.message || 'Failed to send reset email', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setSignupLoading(true);
    setSigninLoading(true);
    try {
      // Use environment variable for production, fallback to current origin for development
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}${createPageUrl('Dashboard')}`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google auth error:', error);
      showToast(error.message || 'Google authentication failed', 'error');
      setSignupLoading(false);
      setSigninLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <div className={`max-w-md p-4 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <p className="font-medium">{toast.message}</p>
              <button 
                onClick={() => setToast({ show: false, message: '', type: '' })}
                className="ml-auto shrink-0 text-white/80 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-6xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Image src="/logo.png" alt="BlogPrecision Logo" width={64} height={64} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to BlogPrecision</h1>
          <p className="text-white/90 text-lg">Choose your path to get started</p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Sign Up Card */}
          <Card className="bg-white shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-green-600">Create Account</CardTitle>
              <p className="text-gray-600">New to BlogPrecision? Start here</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignupSubmit}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-4 h-12"
                  onClick={handleGoogleAuth}
                  disabled={signupLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>

                <div className="relative mb-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500 text-sm">OR</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signup-fullName">Full Name</Label>
                    <Input
                      id="signup-fullName"
                      type="text"
                      placeholder="John Smith"
                      value={signupData.fullName}
                      onChange={(e) => handleSignupInputChange('fullName', e.target.value)}
                      className={signupErrors.fullName ? 'border-red-500' : ''}
                    />
                    {signupErrors.fullName && <p className="text-red-500 text-sm mt-1">{signupErrors.fullName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupData.email}
                      onChange={(e) => handleSignupInputChange('email', e.target.value)}
                      className={signupErrors.email ? 'border-red-500' : ''}
                    />
                    {signupErrors.email && <p className="text-red-500 text-sm mt-1">{signupErrors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={signupData.password}
                      onChange={(e) => handleSignupInputChange('password', e.target.value)}
                      className={signupErrors.password ? 'border-red-500' : ''}
                    />
                    {signupErrors.password && <p className="text-red-500 text-sm mt-1">{signupErrors.password}</p>}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold mt-6"
                  disabled={signupLoading}
                >
                  {signupLoading ? 'Creating...' : 'Create My Account'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign In Card */}
          <Card className="bg-white shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-blue-600">Sign In</CardTitle>
              <p className="text-gray-600">Already have an account? Welcome back</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSigninSubmit}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-4 h-12"
                  onClick={handleGoogleAuth}
                  disabled={signinLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative mb-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500 text-sm">OR</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signinData.email}
                      onChange={(e) => handleSigninInputChange('email', e.target.value)}
                      className={signinErrors.email ? 'border-red-500' : ''}
                    />
                    {signinErrors.email && <p className="text-red-500 text-sm mt-1">{signinErrors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signinData.password}
                      onChange={(e) => handleSigninInputChange('password', e.target.value)}
                      className={signinErrors.password ? 'border-red-500' : ''}
                    />
                    {signinErrors.password && <p className="text-red-500 text-sm mt-1">{signinErrors.password}</p>}
                    <div className="text-right mt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-6"
                  disabled={signinLoading}
                >
                  {signinLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForgotPassword(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
            <p className="text-slate-600 mb-6">Enter your email and we'll send you a link to reset your password.</p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="grow bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                  disabled={resetLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

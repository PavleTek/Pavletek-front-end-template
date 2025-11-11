import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { twoFactorService } from '../services/twoFactorService';
import { authService } from '../services/authService';
import TwoFactorSetup from './TwoFactorSetup';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [requiresTwoFactorSetup, setRequiresTwoFactorSetup] = useState(false);
  const [justReturnedFrom2FA, setJustReturnedFrom2FA] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryCodeSent, setRecoveryCodeSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset the flag after a short delay to prevent auto-submission but allow manual submission
  useEffect(() => {
    if (justReturnedFrom2FA) {
      const timer = setTimeout(() => {
        setJustReturnedFrom2FA(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [justReturnedFrom2FA]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent auto-submission if user just returned from 2FA screen
    if (justReturnedFrom2FA) {
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const response = await login({ username, password });
      
      // Check if 2FA verification is required (user already has 2FA set up)
      if (response.requiresTwoFactor && response.tempToken) {
        setRequiresTwoFactor(true);
        setTempToken(response.tempToken);
        setIsLoading(false);
        return;
      }

      // Check if 2FA setup is required (user doesn't have 2FA set up)
      if (response.requiresTwoFactorSetup && response.tempToken) {
        setRequiresTwoFactorSetup(true);
        setTempToken(response.tempToken);
        setIsLoading(false);
        return;
      }

      // Normal login success
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setIsLoading(false);
      // Don't navigate or reload - just show error
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!tempToken) {
      setError('Session expired. Please login again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await twoFactorService.verifyTwoFactor({
        tempToken,
        code: twoFactorCode
      });

      if (response.token && response.user) {
        // Store auth data and update context
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Reload from localStorage to update context
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
          window.location.reload(); // Simple way to refresh auth state
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid 2FA code. Please try again.');
      setIsLoading(false);
      // Clear the code input on error so user can try again
      setTwoFactorCode('');
      // Don't navigate or reload - just show error
    }
  };

  const handleTwoFactorSetupComplete = async (result?: { token?: string; user?: any }) => {
    if (result?.token && result?.user) {
      // Store auth data and complete login
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Reload to update auth context
      window.location.reload();
    } else {
      // Fallback: switch to verification (shouldn't happen with mandatory setup)
      setRequiresTwoFactorSetup(false);
      setRequiresTwoFactor(true);
    }
  };

  const handleRequestRecoveryCode = async () => {
    if (!tempToken) {
      setError('Session expired. Please login again.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await twoFactorService.requestRecoveryCode({ tempToken });
      setRecoveryCodeSent(true);
      setSuccess('Recovery code sent to your email address');
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send recovery code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!tempToken) {
      setError('Session expired. Please login again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await twoFactorService.verifyRecoveryCode({
        tempToken,
        code: recoveryCode
      });

      if (response.token && response.user) {
        // Store auth data and update context
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Reload from localStorage to update context
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid recovery code. Please try again.');
      setIsLoading(false);
      setRecoveryCode('');
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim()) {
      setError('Please enter your username or email');
      setIsLoading(false);
      return;
    }

    try {
      await authService.requestPasswordReset({ username: username.trim() });
      setForgotPasswordStep('verify');
      setSuccess('If an account with that username or email exists, a password reset code has been sent.');
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send password reset code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetCode || resetCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!newPassword) {
      setError('Password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyPasswordReset({
        username: username.trim(),
        code: resetCode,
        newPassword: newPassword
      });

      setSuccess('Password has been reset successfully. You can now login with your new password.');
      setIsLoading(false);
      
      // Reset form and return to login
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordStep('request');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setUsername('');
        setError('');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
      setIsLoading(false);
      setResetCode('');
    }
  };

  // Show mandatory 2FA setup screen
  if (requiresTwoFactorSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Two-Factor Authentication Required
              </h2>
              <p className="text-sm text-gray-600">
                Your administrator has enabled two-factor authentication. You must set up 2FA to continue.
              </p>
            </div>
            <TwoFactorSetup
              onComplete={handleTwoFactorSetupComplete}
              onCancel={undefined} // No cancel option for mandatory setup
              tempToken={tempToken || undefined}
              isMandatory={true}
            />
          </div>
        </div>
      </div>
    );
  }

  if (requiresTwoFactor) {
    // Show recovery code entry if recovery was requested
    if (showRecovery) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Recovery Code
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {recoveryCodeSent 
                  ? 'Enter the 6-digit recovery code sent to your email'
                  : 'Request a recovery code to reset your 2FA'}
              </p>
            </div>
            {!recoveryCodeSent ? (
              <div className="mt-8 space-y-6">
                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-green-600 text-sm text-center">
                    {success}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRequestRecoveryCode}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Recovery Code'}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecovery(false);
                      setError('');
                      setSuccess('');
                      setRecoveryCodeSent(false);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Back to 2FA
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleVerifyRecoveryCode}>
                <div>
                  <label htmlFor="recoveryCode" className="sr-only">
                    Recovery Code
                  </label>
                  <input
                    id="recoveryCode"
                    name="recoveryCode"
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || recoveryCode.length !== 6}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Recovery Code'}
                  </button>
                </div>
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleRequestRecoveryCode}
                    disabled={isLoading}
                    className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                  >
                    Resend code
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecovery(false);
                        setRecoveryCodeSent(false);
                        setRecoveryCode('');
                        setError('');
                        setSuccess('');
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Back to 2FA
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }

    // Show normal 2FA code entry
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the code from your authenticator app
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleTwoFactorSubmit}>
            <div>
              <label htmlFor="twoFactorCode" className="sr-only">
                2FA Code
              </label>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || twoFactorCode.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Lost access to your authenticator?
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setRequiresTwoFactor(false);
                    setTempToken(null);
                    setTwoFactorCode('');
                    setError('');
                    setJustReturnedFrom2FA(true);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Back to login
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show forgot password flow
  if (showForgotPassword) {
    if (forgotPasswordStep === 'request') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Reset Password
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Enter your username or email to receive a password reset code
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleRequestPasswordReset}>
              <div>
                <label htmlFor="reset-username" className="sr-only">
                  Username or Email
                </label>
                <input
                  id="reset-username"
                  name="reset-username"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Username or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-green-600 text-sm text-center">
                  {success}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setUsername('');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // Verify & Reset step
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the code sent to your email and your new password
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleVerifyPasswordReset}>
            <div>
              <label htmlFor="reset-code" className="sr-only">
                Reset Code
              </label>
              <input
                id="reset-code"
                name="reset-code"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="new-password" className="sr-only">
                New Password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 text-sm text-center">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || resetCode.length !== 6 || !newPassword || newPassword !== confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleRequestPasswordReset(e);
                }}
                disabled={isLoading}
                className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                Resend code
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordStep('request');
                    setResetCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Back to login
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm text-center">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
                setSuccess('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

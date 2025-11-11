import React, { useState, useEffect } from 'react';
import { twoFactorService } from '../services/twoFactorService';
import SuccessBanner from './SuccessBanner';
import ErrorBanner from './ErrorBanner';

interface TwoFactorSetupProps {
  onComplete?: (result?: { token?: string; user?: any }) => void;
  onCancel?: () => void;
  tempToken?: string; // For mandatory setup during login
  isMandatory?: boolean; // If true, setup cannot be cancelled
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel, tempToken, isMandatory = false }) => {
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    initializeSetup();
  }, [tempToken]);

  const initializeSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = tempToken 
        ? await twoFactorService.setupTwoFactorMandatory(tempToken)
        : await twoFactorService.setupTwoFactor();
      setSecret(response.secret);
      setQrCode(response.qrCode);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret) return;

    try {
      setLoading(true);
      setError(null);
      
      if (tempToken && isMandatory) {
        // Mandatory setup during login - this completes the login
        const response = await twoFactorService.verifySetupMandatory(tempToken, secret, verificationCode);
        setStep('complete');
        setSuccess('2FA enabled successfully!');
        
        // Call onComplete with login data
        if (onComplete && response.token && response.user) {
          onComplete({
            token: response.token,
            user: response.user
          });
        }
      } else {
        // Regular setup (from profile page)
        await twoFactorService.verifySetup({
          secret,
          code: verificationCode
        });
        setStep('complete');
        setSuccess('2FA enabled successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid verification code');
      setVerificationCode(''); // Clear code on error
      setLoading(false);
      // Don't navigate or reload - just show error
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (step === 'complete') {
    return (
      <div className="space-y-4">
        {success && <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />}
        
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            2FA Enabled Successfully!
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Your two-factor authentication has been enabled. If you lose access to your authenticator device, you can use the recovery code feature to regain access to your account.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleComplete}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-4">
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verify Setup
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter the 6-digit code from your authenticator app to complete the setup.
          </p>
          
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="000000"
                autoFocus
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('setup');
                  setVerificationCode('');
                  setError(null);
                }}
                className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xs border border-gray-300 hover:bg-gray-50"
              >
                Back to QR Code
              </button>
              {onCancel && !isMandatory && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xs border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className={`${onCancel && !isMandatory ? 'flex-1' : 'flex-1'} rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Initializing 2FA setup...</div>
        </div>
      ) : qrCode && secret ? (
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Set Up Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
            </p>
          </div>

          <div className="flex justify-center bg-white p-4 rounded-md border border-gray-300">
            <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
          </div>

          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Can't scan? Enter this code manually:</p>
            <div className="font-mono text-sm bg-white p-2 rounded border border-gray-300 text-center break-all">
              {secret}
            </div>
          </div>

          <div className="flex gap-3">
            {onCancel && !isMandatory && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xs border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => setStep('verify')}
              className={`${onCancel && !isMandatory ? 'flex-1' : 'w-full'} rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500`}
            >
              I've Scanned the Code
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-600">
          Failed to load QR code. Please try again.
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;


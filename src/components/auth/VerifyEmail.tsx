import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import pb from '../../lib/pocketbase';
import { OwnerIcon } from '../shared/OwnerIcons';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setErrorMessage('Invalid or missing verification token.');
                return;
            }

            try {
                await pb.collection('users').confirmVerification(token);
                setStatus('success');
            } catch (err: any) {
                console.error('Email verification failed:', err);
                setStatus('error');
                setErrorMessage(err.message || 'Failed to verify email. The link may be invalid or expired.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <OwnerIcon name="Envelope" className="w-8 h-8 text-[#1d2a78]" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
                        <p className="text-gray-600">Please wait while we verify your email address.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <OwnerIcon name="CheckCircle" className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                        <p className="text-gray-600 mb-6">
                            Your email has been successfully verified. You can now access all features of the platform.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-[#1d2a78] text-white rounded-xl font-bold hover:bg-[#0f1c4d] transition-colors"
                        >
                            Continue to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <OwnerIcon name="ExclamationCircle" className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-600 mb-6">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;

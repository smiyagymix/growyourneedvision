
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from './shared/OwnerIcons';
import { GoogleIcon, MicrosoftIcon } from './shared/CommonUI';
import { useAuth } from '../context/AuthContext';
import pb from '../lib/pocketbase';
import { loginSchema, registerSchema, emailSchema } from '../validation/schemas';
import { sanitizeText } from '../utils/sanitization';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const LoginPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const navigate = useNavigate();
    const { login, register, error, user } = useAuth();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (mode === 'login') {
                // Validate login credentials
                const validationResult = loginSchema.safeParse({
                    email: sanitizeText(email),
                    password
                });

                if (!validationResult.success) {
                    alert(`Validation error: ${validationResult.error.issues[0].message}`);
                    return;
                }

                if (email && password) {
                    await login(email, password);
                    navigate('/');
                }
            } else if (mode === 'signup') {
                // Validate registration
                const validationResult = registerSchema.safeParse({
                    email: sanitizeText(email),
                    password,
                    passwordConfirm: password,
                    name: sanitizeText(name)
                });

                if (!validationResult.success) {
                    alert(`Validation error: ${validationResult.error.issues[0].message}`);
                    return;
                }

                if (email && password && name) {
                    await register(email, password, password, name);
                    navigate('/');
                }
            } else if (mode === 'forgot') {
                // Validate email for password reset
                const validationResult = emailSchema.safeParse(sanitizeText(email));

                if (!validationResult.success) {
                    alert(`Validation error: ${validationResult.error.issues[0].message}`);
                    return;
                }

                try {
                    await pb.collection('users').requestPasswordReset(email);
                    alert(`Password reset link sent to ${email}`);
                    setMode('login');
                } catch (err) {
                    console.error("Reset request failed", err);
                    alert("Failed to send reset link. Please check the email address.");
                }
            } else if (mode === 'reset') {
                // Note: Password reset usually requires a token from the email link.
                // This UI state would typically be reached via a route like /confirm-password-reset?token=...
                // For this stub, we'll just simulate success or redirect.
                alert('Please use the link sent to your email to reset your password.');
                setMode('login');
            }
        } catch (err) {
            console.error('Authentication error:', err);
            // Error is already handled in AuthContext and exposed via error prop
        }
    };

    const getVisualContent = () => {
        switch (mode) {
            case 'login':
                return {
                    title: 'Welcome Back',
                    subtitle: 'Secure Access to Your Ecosystem',
                    icon: 'AuthLogin3D',
                    gradient: 'from-[#0f1c4d] to-[#1d2a78]'
                };
            case 'signup':
                return {
                    title: 'Join the Future',
                    subtitle: 'Create Your Digital Identity',
                    icon: 'AuthSignup3D',
                    gradient: 'from-[#004D40] to-[#00695C]'
                };
            case 'forgot':
                return {
                    title: 'Account Recovery',
                    subtitle: 'We will help you get back in',
                    icon: 'AuthForgot3D',
                    gradient: 'from-[#3E2723] to-[#5D4037]'
                };
            case 'reset':
                return {
                    title: 'New Security',
                    subtitle: 'Set a strong password',
                    icon: 'AuthReset3D',
                    gradient: 'from-[#263238] to-[#37474F]'
                };
        }
    };

    const visual = getVisualContent();

    return (
        <div className="h-screen w-screen overflow-hidden flex bg-gray-50 font-sans">

            {/* --- LEFT SIDE: VISUAL (Desktop/Tablet) --- */}
            <div className={`hidden md:flex md:w-1/2 h-full relative overflow-hidden items-center justify-center bg-gradient-to-br ${visual.gradient} transition-colors duration-700`}>
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-pulse" style={{ animationDuration: '10s' }}></div>
                </div>

                <div className="relative z-10 p-8 lg:p-12 text-center max-w-lg">
                    <div className="w-48 h-48 lg:w-64 lg:h-64 mx-auto mb-8 relative animate-fadeIn">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-[60px] animate-pulse"></div>
                        <div className="relative z-10 w-full h-full drop-shadow-2xl filter hover:scale-105 transition-transform duration-500">
                            <OwnerIcon name={visual.icon} className="w-full h-full" />
                        </div>
                    </div>

                    <h1 className="text-2xl lg:text-4xl font-black text-white mb-4 tracking-tight drop-shadow-lg transition-all duration-300 transform translate-y-0 opacity-100">
                        {visual.title}
                    </h1>
                    <p className="text-blue-100 text-sm lg:text-base font-medium tracking-wide uppercase opacity-80">
                        {visual.subtitle}
                    </p>
                </div>

                <div className="absolute bottom-8 left-8 text-white/40 text-[10px] font-bold tracking-widest uppercase">
                    Grow Your Need • OS v2.0
                </div>
            </div>


            {/* --- RIGHT SIDE: FORM --- */}
            <div className="w-full md:w-1/2 h-full flex items-center justify-center relative bg-[#f8f9fa] overflow-hidden">

                <div className="absolute inset-0 md:hidden bg-gradient-to-br from-[#1d2a78] to-[#0f1c4d] z-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                </div>

                <div className="absolute top-6 left-0 right-0 flex justify-center md:hidden z-20">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                        <OwnerIcon name="StudioIcon3D" className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="w-full h-full max-h-full overflow-y-auto no-scrollbar flex items-center justify-center p-4 md:p-8 relative z-10">

                    <div className="w-full max-w-md bg-white/90 md:bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.5)] p-6 md:p-8 lg:p-10 transition-all duration-300 my-auto">

                        <div className="text-center mb-6 md:mb-8">
                            <h2 className="text-xl md:text-2xl font-black text-[#0f1c4d] mb-1">
                                {mode === 'login' && 'Sign In'}
                                {mode === 'signup' && 'Create Account'}
                                {mode === 'forgot' && 'Reset Password'}
                                {mode === 'reset' && 'Update Password'}
                            </h2>
                            <p className="text-gray-500 text-xs md:text-sm">
                                {mode === 'login' && 'Enter your credentials to access your dashboard.'}
                                {mode === 'signup' && 'Join thousands of schools and creators.'}
                                {mode === 'forgot' && 'Enter your email to receive instructions.'}
                                {mode === 'reset' && 'Choose a secure password for your account.'}
                            </p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <OwnerIcon name="UserIcon" className="w-4 h-4 text-gray-400 group-focus-within:text-[#1d2a78] transition-colors" />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1d2a78]/20 focus:border-[#1d2a78] transition-all shadow-inner"
                                    />
                                </div>
                            )}

                            {mode !== 'reset' && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <OwnerIcon name="Envelope" className="w-4 h-4 text-gray-400 group-focus-within:text-[#1d2a78] transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1d2a78]/20 focus:border-[#1d2a78] transition-all shadow-inner"
                                    />
                                </div>
                            )}

                            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <OwnerIcon name="CogIcon" className="w-4 h-4 text-gray-400 group-focus-within:text-[#1d2a78] transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder={mode === 'reset' ? "New Password" : "Password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1d2a78]/20 focus:border-[#1d2a78] transition-all shadow-inner"
                                    />
                                </div>
                            )}

                            {mode === 'login' && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setMode('forgot')}
                                        className="text-xs font-bold text-[#1d2a78] hover:text-[#ff6b00] transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0f1c4d] to-[#1d2a78] text-white font-bold text-sm shadow-[0_10px_20px_rgba(29,42,120,0.3)] hover:shadow-[0_15px_30px_rgba(29,42,120,0.4)] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 group mt-2"
                            >
                                <span>
                                    {mode === 'login' && 'Sign In Dashboard'}
                                    {mode === 'signup' && 'Create Account'}
                                    {mode === 'forgot' && 'Send Recovery Link'}
                                    {mode === 'reset' && 'Reset Password'}
                                </span>
                                <OwnerIcon name="ArrowRightIcon" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        {/* ERROR DISPLAY */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-xs text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        {(mode === 'login' || mode === 'signup') && (
                            <div className="mt-6">
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-gray-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] uppercase font-bold tracking-widest">Or Continue With</span>
                                    <div className="flex-grow border-t border-gray-200"></div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button className="flex-1 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-center gap-2 active:scale-95">
                                        <GoogleIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold text-gray-600">Google</span>
                                    </button>
                                    <button className="flex-1 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-center gap-2 active:scale-95">
                                        <MicrosoftIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold text-gray-600">Microsoft</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 text-center text-xs md:text-sm text-gray-600 font-medium">
                            {mode === 'login' && (
                                <>
                                    Don't have an account?{' '}
                                    <button onClick={() => setMode('signup')} className="text-[#1d2a78] font-bold hover:underline">Sign Up</button>
                                </>
                            )}
                            {mode === 'signup' && (
                                <>
                                    Already have an account?{' '}
                                    <button onClick={() => setMode('login')} className="text-[#1d2a78] font-bold hover:underline">Sign In</button>
                                </>
                            )}
                            {(mode === 'forgot' || mode === 'reset') && (
                                <button onClick={() => setMode('login')} className="text-[#1d2a78] font-bold hover:underline flex items-center justify-center gap-2 mx-auto">
                                    <OwnerIcon name="ChevronLeft" className="w-3 h-3" /> Back to Login
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

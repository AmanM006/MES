'use client';

import { useState, ChangeEvent, FormEvent, InputHTMLAttributes } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added for the Login link

const ColorBends = dynamic(() => import('@/components/ColorBends'), {
  ssr: false,
});

// Logic Types
type UserType = 'MIT' | 'NON_MIT';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>('MIT');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false); // Toggle between Register and OTP
  const [otpValue, setOtpValue] = useState('');
  
  const [status, setStatus] = useState<{ message: string; type: 'error' | 'success' | null }>({
    message: '',
    type: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    regNumber: '',
    learnerEmail: '',
    personalEmail: '',
    phone: '',
    password: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status.message) setStatus({ message: '', type: null });
  };

  // --- 1. HANDLE REGISTRATION (Unchanged Logic) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      userType,
      name: formData.name,
      personalEmail: formData.personalEmail,
      phone: formData.phone,
      password: formData.password,
      ...(userType === 'MIT' && {
        regNumber: formData.regNumber,
        learnerEmail: formData.learnerEmail,
      }),
    };

    try {
      const res = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ message: 'User registered! Please check your email for OTP.', type: 'success' });
        setShowOtp(true); // Move to OTP screen
      } else {
        setStatus({ message: data.message || 'Registration failed', type: 'error' });
      }
    } catch (err) {
      setStatus({ message: 'Connection error. Check backend.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HANDLE OTP VERIFICATION (Unchanged Logic) ---
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.personalEmail, 
          otp: otpValue 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ message: 'Email verified! Redirecting to login...', type: 'success' });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setStatus({ message: data.message || 'Invalid OTP', type: 'error' });
      }
    } catch (err) {
      setStatus({ message: 'Verification error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white text-gray-900 font-sans">
      
      {/* ============================================================
          LEFT COLUMN: FORM (White Background)
      ============================================================ */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 md:px-12 lg:px-24 py-12 overflow-y-auto">
        
        {/* Header / Logo */}
        <div className="mb-10">
          <h1 className="font-serif-display text-3xl font-bold tracking-wide text-[#00684a]">
             MES <span className="text-gray-900 font-sans font-normal text-xl ml-1">2026</span>
          </h1>
        </div>

        <div className="max-w-md w-full mx-auto lg:mx-0">
            <h2 className="text-4xl font-serif-display font-medium text-slate-900 mb-3">
              {showOtp ? 'Verify OTP' : 'Create an account'}
            </h2>
            
            <p className="text-slate-600 mb-8">
              {showOtp ? (
                <span>Enter the code sent to <span className="font-semibold text-slate-900">{formData.personalEmail}</span></span>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#00684a] font-bold hover:underline">
                    Log In
                  </Link>
                </>
              )}
            </p>

            {status.message && (
                <div className={`mb-6 p-4 rounded-lg text-sm font-medium border ${
                    status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                {status.message}
                </div>
            )}

            {!showOtp ? (
                /* --- REGISTRATION FORM --- */
                <form className="space-y-5" onSubmit={handleSubmit}>
                
                {/* User Type Toggle (Segmented Control style) */}
                <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                    <button 
                        type="button" 
                        onClick={() => setUserType('MIT')} 
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                            userType === 'MIT' 
                            ? 'bg-white text-[#00684a] shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        MIT Student
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setUserType('NON_MIT')} 
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                            userType === 'NON_MIT' 
                            ? 'bg-white text-[#00684a] shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Other
                    </button>
                </div>

                <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                
                {userType === 'MIT' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="Reg Number" name="regNumber" value={formData.regNumber} onChange={handleChange} required placeholder="MEC123" />
                        <InputField label="Learner Email" name="learnerEmail" type="email" value={formData.learnerEmail} onChange={handleChange} required placeholder="john@learner..." />
                    </div>
                )}
                
                <InputField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="9876543210" />
                <InputField label="Personal Email" name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} required placeholder="john@gmail.com" />
                <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />

                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full mt-6 bg-[#00684a] text-white py-3 px-4 rounded-lg font-bold hover:bg-[#00523a] transition-colors focus:ring-4 focus:ring-[#00684a]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-6">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
                </form>
            ) : (
                /* --- OTP VERIFICATION SCREEN --- */
                <form className="space-y-6" onSubmit={handleVerify}>
                    <InputField 
                        label="Enter 6-Digit OTP" 
                        value={otpValue} 
                        onChange={(e) => setOtpValue(e.target.value)} 
                        required 
                        placeholder="123456" 
                        maxLength={6}
                        className="text-center text-3xl tracking-[0.5em] py-4 font-mono"
                    />

                    <div className="space-y-4">
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-[#00684a] text-white py-3 px-4 rounded-lg font-bold hover:bg-[#00523a] transition-colors shadow-lg shadow-[#00684a]/20 disabled:opacity-70"
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={async () => {
                                await fetch('http://localhost:8080/auth/resend-otp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: formData.personalEmail }),
                                });
                                setStatus({ message: 'OTP Resent!', type: 'success' });
                            }}
                            className="w-full text-sm text-[#00684a] font-bold hover:underline"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>

      {/* ============================================================
          RIGHT COLUMN: ARTWORK (Dark Green)
      ============================================================ */}
      <div className="hidden lg:flex w-[45%] bg-[#001e2b] relative flex-col items-center justify-center p-12 overflow-hidden text-white">
        
        {/* We keep your ColorBends here as the "Graphic" */}
        <div className="absolute inset-0 opacity-40">
            <ColorBends colors={['#00ED64', '#001e2b', '#00684a']} speed={0.15} />
        </div>

        <div className="relative z-10 max-w-lg text-center">
            <div className="mb-8 relative inline-block">
                {/* Decorative Icon or Graphic Placeholder */}
                <div className="w-24 h-24 bg-[#00ED64] rounded-2xl rotate-12 mx-auto flex items-center justify-center shadow-2xl">
                    <span className="text-[#001e2b] text-4xl font-bold">M</span>
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-lg -rotate-6 opacity-80"></div>
            </div>
            
            <h3 className="text-3xl font-bold mb-4 font-serif-display tracking-wide">
                Innovation awaits.
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
                Join the largest entrepreneurship summit of the year. Connect, build, and launch your ideas with MES 2026.
            </p>
        </div>

        {/* Decorative Grid Line (optional to match MongoDB vibe) */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[linear-gradient(to_top,#00ED6405_1px,transparent_1px),linear-gradient(to_right,#00ED6405_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      </div>

    </div>
  );
}

// Clean Input Component (MongoDB Style)
function InputField({ label, ...props }: InputFieldProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-0.5">
        {label}
      </label>
      <input
        {...props}
        className={`
            w-full rounded-lg px-4 py-2.5 
            bg-white border border-gray-300 
            text-slate-900 placeholder:text-gray-400
            focus:outline-none focus:border-[#00684a] focus:ring-1 focus:ring-[#00684a] 
            transition-all duration-200
            ${props.className}
        `}
      />
    </div>
  );
}
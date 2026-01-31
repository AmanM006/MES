'use client';

import { useState, FormEvent, useEffect, InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

// Reuse the visual component
const ColorBends = dynamic(() => import('@/components/ColorBends'), { ssr: false });

// --- VISUAL SLIDER CONTENT ---
const SLIDES = [
  {
    title: <>Welcome Back,<br />Innovator.</>,
    desc: "The summit awaits. Log in to access your dashboard and schedule."
  },
  {
    title: <>Resume Your<br />Journey.</>,
    desc: "Pick up where you left off. The future is being built today."
  },
  {
    title: <>Ready to<br />Disrupt?</>,
    desc: "Your pass to the ecosystem is ready. Let's get started."
  }
];

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const router = useRouter();

  // --- SLIDER LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/auth/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", 
      });

      const data = await response.json();

      if (response.ok) {
        setTimeout(() => router.push('/student'), 500);
      } else {
        setError(data.message || "Login failed.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setError("Connection error: Ensure backend is running on port 8080");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#050505] font-sans p-2 md:p-4 selection:bg-purple-500/30">
      
      {/* ============================================================
        THE FLOATING CARD CONTAINER
        Matches Signup Page Dimensions: w-[96vw] max-w-[1600px] h-[92vh]
      ============================================================ */}
      <div className="relative w-[96vw] max-w-[1600px] h-[92vh] bg-[#0a0a0a] rounded-[30px] overflow-hidden flex shadow-2xl border border-white/5">
        
        {/* ============================================================
          LEFT SIDE: VISUALS & SLIDER (60%)
        ============================================================ */}
        <div className="hidden lg:block w-[60%] h-full relative overflow-hidden bg-black">
            {/* Back Button */}
            <Link 
                href="/"
                className="absolute top-8 right-8 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-all duration-300 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to website
            </Link>

            {/* 3D Background - Using different colors for Login to distinguish it */}
            <div className="absolute inset-0 opacity-80">
                {/* Cyan/Blue/Emerald theme for Login */}
                <ColorBends colors={['#0ea5e9', '#10b981', '#000000']} speed={0.2} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

            {/* Content Slider at Bottom Left */}
            <div className="absolute bottom-12 left-12 z-20 max-w-lg">
                <div className="h-[140px] flex items-end"> 
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <h2 className="text-5xl xl:text-6xl font-serif-display italic font-bold mb-4 text-white leading-tight">
                            {SLIDES[currentSlide].title}
                        </h2>
                        <p className="text-gray-400 text-sm xl:text-base leading-relaxed max-w-sm">
                            {SLIDES[currentSlide].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>
                </div>
                
                {/* Active Dots Indicators */}
                <div className="flex gap-2 mt-8">
                    {SLIDES.map((_, index) => (
                        <div 
                            key={index}
                            className={`h-1 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* ============================================================
          RIGHT SIDE: FORM (40%)
        ============================================================ */}
        <div className="w-full lg:w-[40%] h-full bg-[#0E0E0E] flex flex-col justify-center px-8 md:px-16 py-8 relative overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
            
            {/* Mobile Header */}
            <div className="lg:hidden mb-8 flex justify-between items-center">
                <Link href="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={16} /> Back
                </Link>
                <span className="font-serif-display italic font-bold text-xl">MES 2026</span>
            </div>

            <div className="w-full max-w-sm mx-auto">
                <div className="mb-2">
                    <h1 className="font-serif-display text-4xl font-bold italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6">
                        MES <span className="font-sans font-light text-2xl not-italic text-blue-400">2026</span>
                    </h1>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">
                    Sign In
                </h2>
                
                <p className="text-gray-500 text-xs mb-8">
                    Don't have an account? <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Create one now</Link>
                </p>

                {/* Status/Error Message */}
                <AnimatePresence mode='wait'>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-3 rounded-lg flex items-center gap-3 text-xs font-medium border bg-red-500/5 border-red-500/20 text-red-400"
                        >
                            <AlertCircle size={14} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* LOGIN FORM */}
                <form className="space-y-5" onSubmit={handleLogin}>
                    
                    <InputField 
                        label="Email Address" 
                        type="email" 
                        value={email} 
                        onChange={(e) => { setEmail(e.target.value); setError(null); }} 
                        required 
                        placeholder="john@example.com" 
                    />
                    
                    <div className="space-y-1">
                        <InputField 
                            label="Password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => { setPassword(e.target.value); setError(null); }} 
                            required 
                            placeholder="••••••••" 
                        />
                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-[10px] text-gray-500 hover:text-white transition-colors mt-1">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="group w-full mt-6 bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : (
                            <>Login <ArrowRight size={14} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
}

// --------------------------------------------------------
// INPUT COMPONENT (Reusable Filled Style)
// --------------------------------------------------------
function InputField({ label, ...props }: InputFieldProps) {
    return (
      <div className="w-full">
        <div className="relative group">
            <input
            {...props}
            className={`
                peer w-full rounded-xl px-4 py-3.5 pt-5 pb-2 text-sm
                bg-[#1a1a1a] border border-[#333] 
                text-white placeholder-transparent
                focus:outline-none focus:border-blue-500 focus:bg-[#202020]
                transition-all duration-200
                ${props.className}
            `}
            placeholder={props.placeholder}
            />
            <label className="absolute left-4 top-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition-all duration-200 
                              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-600 peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal
                              peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-blue-400 pointer-events-none">
                {label}
            </label>
        </div>
      </div>
    );
}
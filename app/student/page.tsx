'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import Script from 'next/script';
import apiClient from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Ticket as TicketIcon, Calendar, CheckCircle2, Clock, MapPin, ArrowLeft, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';

const ColorBends = dynamic(() => import('@/components/ColorBends'), { ssr: false });

// --- SUCCESS OVERLAY COMPONENT ---
const SuccessOverlay = ({ onClose }: { onClose: () => void }) => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="relative max-w-sm w-full bg-[#111] border border-emerald-500/30 rounded-[32px] p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)]"
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px]" />
            <div className="relative z-10">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                    <CheckCircle2 size={40} className="text-white" />
                </motion.div>
                <h2 className="text-3xl font-serif-display italic font-bold text-white mb-2">Ticket Secured!</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    Your transaction was successful. The digital pass has been added to your dashboard.
                </p>
                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] transition-transform active:scale-95"
                >
                    View My Pass
                </button>
            </div>
        </motion.div>
    </motion.div>
);

interface Ticket {
    _id: string;
    eventName: string;
    paymentStatus: string;
    isUsed: boolean;
    qrData?: string; // 👈 Add this line
}

const CONCLAVES = [
    { id: 'fintech', title: 'FinTech Panel', displayDate: 'Feb 12', venue: 'MV Hall', time: '10:00 AM' },
    { id: 'built-her', title: 'Built By Her', displayDate: 'Feb 13', venue: 'Lib Aud', time: '2:00 PM' },
    { id: 'mindverse', title: 'MindVerse 2026', displayDate: 'Feb 14', venue: 'MSCE', time: '11:00 AM' }
];

const TARGET_EVENT_NAME = "MES Conclave 2026"; 

export default function StudentDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // --- FETCH DATA ---
    const fetchDashboardData = useCallback(async () => {
        try {
            const res = await apiClient.get('/tickets/my-tickets');
            const ticketData = res.data.success ? res.data.data : res.data;
            setTickets(Array.isArray(ticketData) ? ticketData : []);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- CALLBACK URL STATUS HANDLER ---
    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'success') {
            setShowSuccess(true);
            fetchDashboardData();
            router.replace('/student');
        } else if (status === 'failed') {
            alert("❌ Payment Failed. Please try again.");
            router.replace('/student');
        }
    }, [searchParams, fetchDashboardData, router]);

    // --- AUTH CHECK ---
    useEffect(() => {
        if (!authLoading) {
            if (user) {
                fetchDashboardData();
            } else {
                setLoading(false);
                router.push('/login');
            }
        }
    }, [user, authLoading, fetchDashboardData, router]);

    // --- ACTIVE TICKET CHECK ---
    const activeTicket = tickets.find(t => 
        t.eventName === TARGET_EVENT_NAME && 
        (t.paymentStatus === 'SUCCESS' || t.paymentStatus === 'PAID')
    );
    const hasPaidTicket = !!activeTicket;

    // --- QR GENERATION ---
 // --- SECURE QR GENERATION ---
useEffect(() => {
    if (activeTicket && user) {
        // 1. If backend sent an encrypted hash, use it directly
        if (activeTicket.qrData && activeTicket.qrData !== "VALIDATED") {
            QRCode.toDataURL(activeTicket.qrData, { 
                width: 300, 
                margin: 2,
                color: { dark: '#FFFFFF', light: '#00000000' }
            }).then(setQrUrl);
        } 
        // 2. Fallback: generate local payload if qrData isn't ready yet
        else {
            const payload = JSON.stringify({
                username: user.name,
                regNo: user.regNumber,
                ticketId: activeTicket._id,
                timestamp: new Date().toISOString()
            });

            QRCode.toDataURL(payload, { 
                width: 300, 
                margin: 2,
                color: { dark: '#FFFFFF', light: '#00000000' }
            }).then(setQrUrl);
        }
    } else {
        setQrUrl(null);
    }
}, [activeTicket, user]);
    // --- 1. OPEN ATOM POPUP ---
    const openAtomPay = (token: string, merchId: string) => {
        const options = {
            atomTokenId: token,
            merchId: merchId,
            custEmail: user?.personalEmail || "test@example.com",
            custMobile: user?.phone || "9999999999",
            returnUrl: `http://localhost:8080/payment/callback`,
        };

        try {
            // @ts-ignore
            if (typeof AtomPaynetz === 'undefined') {
                alert("Payment Gateway is still loading. Please try again.");
                return;
            }
            // @ts-ignore
            const atom = new AtomPaynetz(options, 'uat'); 
            console.log("🚀 Launched Atom Popup");
        } catch (error) {
            console.error("Atom SDK Error:", error);
            alert("Failed to launch payment popup.");
        }
    };

    // --- 2. INITIATE PAYMENT ---
    const handleBuyTicket = async () => {
        setPaymentLoading(true);
        try {
            console.log("1. Requesting Token...");
            const res = await apiClient.post('/payment/initiate', {
                eventName: TARGET_EVENT_NAME,
                amount: 1, // SET TO 1 FOR TESTING
            });

            const responseData = res.data.data || res.data;
            if (responseData.atomTokenId) {
                openAtomPay(responseData.atomTokenId, responseData.merchId);
            } else {
                throw new Error("No token received");
            }

        } catch (error: any) {
            console.error("PAYMENT ERROR:", error);
            const msg = error.response?.data?.message || error.message;
            alert(`Payment Error: ${msg}`);
        } finally {
            setPaymentLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-[#050505] font-sans p-2 md:p-4 selection:bg-purple-500/30 text-white">
            
            <Script 
                src={process.env.NEXT_PUBLIC_ATOM_CDN_URL} 
                strategy="lazyOnload" 
                onLoad={() => console.log("✅ Atom Payment SDK Loaded")}
            />

            <AnimatePresence>
                {showSuccess && <SuccessOverlay onClose={() => setShowSuccess(false)} />}
            </AnimatePresence>

            <div className="relative w-[96vw] max-w-[1600px] h-[92vh] bg-[#0a0a0a] rounded-[30px] overflow-hidden flex shadow-2xl border border-white/5">
                
                {/* --- LEFT SIDE: VISUALS + QR --- */}
                <div className="hidden lg:block w-[35%] h-full relative overflow-hidden bg-black border-r border-white/5">
                    <Link 
                        href="/"
                        className="absolute top-8 left-8 z-30 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all duration-300 group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Home
                    </Link>

                    <div className="absolute inset-0 opacity-80">
                        <ColorBends colors={['#7e22ce', '#3b82f6', '#000000']} speed={0.15} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full max-w-sm"
                        >
                            <div className="relative overflow-hidden rounded-[24px] bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl p-1">
                                <div className="relative rounded-[20px] bg-black/40 p-8 flex flex-col items-center text-center overflow-hidden">
                                    
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-purple-500/30 to-blue-500/30 rounded-full blur-[60px] transition-all duration-700 ${hasPaidTicket ? 'opacity-100' : 'opacity-0'}`} />

                                    <div className="relative z-10 mb-6">
                                        <div className={`w-56 h-56 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center p-3 transition-all duration-500 ${!hasPaidTicket ? 'shadow-none' : 'shadow-[0_0_40px_rgba(124,58,237,0.15)]'}`}>
                                            {qrUrl ? (
                                                <img src={qrUrl} alt="Ticket QR" className="w-full h-full object-contain rounded-lg" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 w-full h-full justify-center">
                                                    <div className="p-4 rounded-full bg-white/5 border border-white/10">
                                                        <TicketIcon size={24} className="text-gray-400" />
                                                    </div>
                                                    <button 
                                                        onClick={handleBuyTicket}
                                                        disabled={paymentLoading}
                                                        className="group flex items-center gap-2 px-5 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {paymentLoading ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12} strokeWidth={4} />}
                                                        {paymentLoading ? 'Processing...' : 'Get Pass'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-xl shadow-lg flex items-center gap-2 whitespace-nowrap ${
                                                hasPaidTicket 
                                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                                : 'bg-white/10 border-white/20 text-gray-400'
                                            }`}>
                                                {hasPaidTicket ? <CheckCircle2 size={12} /> : <div className="w-2 h-2 rounded-full bg-gray-500" />}
                                                {hasPaidTicket ? 'Access Granted' : 'No Active Pass'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 w-full pt-4 border-t border-white/10">
                                        <h3 className="text-2xl font-bold text-white mb-1">{user.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mb-4">{user.regNumber || 'GUEST USER'}</p>
                                        
                                        {hasPaidTicket && (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">ID</p>
                                                <p className="text-xs font-mono text-purple-300">#{activeTicket?._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* --- RIGHT SIDE: DASHBOARD --- */}
                <div className="w-full lg:w-[65%] h-full bg-[#0E0E0E] flex flex-col relative overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                    <div className="p-8 md:p-12 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-gray-400">
                                    Dashboard
                                </span>
                                {user.userType === 'MIT' && (
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                        MIT Student
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif-display italic font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">
                                Welcome, {user.name.split(' ')[0]}
                            </h1>
                        </div>

                        {!hasPaidTicket && (
                            <button
                                onClick={handleBuyTicket}
                                disabled={paymentLoading}
                                className="group relative px-6 py-2.5 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {paymentLoading ? 'Loading...' : 'Get Pass'}
                            </button>
                        )}
                    </div>

                    <div className="p-8 md:p-12 space-y-8">
                        {/* 1. Quick Stats */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            <div className="p-6 rounded-2xl bg-[#151515] border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity text-purple-500">
                                    <Calendar size={80} />
                                </div>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Event Status</p>
                                <h3 className="text-2xl font-serif-display italic text-white">Live in 12 Days</h3>
                                <p className="text-xs text-gray-400 mt-2">Get ready for the summit.</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-[#151515] border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity text-blue-500">
                                    <MapPin size={80} />
                                </div>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Venue</p>
                                <h3 className="text-2xl font-serif-display italic text-white">MIT Manipal</h3>
                                <p className="text-xs text-gray-400 mt-2">Academic Block 5 & Library.</p>
                            </div>
                        </motion.div>

                        {/* 2. Timeline */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock size={16} className="text-purple-400" />
                                    Upcoming Sessions
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Feb 2026</span>
                            </div>

                            <div className="space-y-3">
                                {CONCLAVES.map((event) => (
                                    <div 
                                        key={event.id}
                                        className="group flex items-center p-4 rounded-xl bg-[#151515] border border-white/5 hover:border-white/10 hover:bg-[#1a1a1a] transition-all duration-300"
                                    >
                                        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-black/40 flex flex-col items-center justify-center border border-white/5 group-hover:border-purple-500/30 transition-colors">
                                            <span className="text-[9px] font-bold uppercase text-gray-500">{event.displayDate.split(' ')[0]}</span>
                                            <span className="text-lg font-bold text-white">{event.displayDate.split(' ')[1]}</span>
                                        </div>

                                        <div className="ml-5 flex-grow">
                                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
                                                {event.title}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                                                    <Clock size={10} />
                                                    {event.time}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                                                    <MapPin size={10} />
                                                    {event.venue}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                                                <CheckCircle2 size={14} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
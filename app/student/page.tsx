'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Added for routing
import QRCode from 'qrcode';
import apiClient from '../lib/api-client';
import { useAuth } from '../lib/auth-context';

interface Ticket {
    _id: string;
    eventName: string;
    paymentStatus: string;
    isUsed: boolean;
}

const CONCLAVES = [
    { id: 'fintech', title: 'FinTech Panel', displayDate: 'Feb 12', venue: 'MV Hall' },
    { id: 'built-her', title: 'Built By Her', displayDate: 'Feb 13', venue: 'Lib Aud' },
    { id: 'mindverse', title: 'MindVerse 2026', displayDate: 'Feb 14', venue: 'MSCE' }
];

// Ensure this matches exactly what you send from the backend/events page
const TARGET_EVENT_NAME = "MES Conclave 2026"; 

export default function StudentDashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            // Get tickets from backend
            const res = await apiClient.get('/tickets/my-tickets');
            const ticketData = res.data.success ? res.data.data : res.data;
            setTickets(Array.isArray(ticketData) ? ticketData : []);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardData();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading, fetchDashboardData]);

    // Generate QR if ticket exists
    useEffect(() => {
        const activeTicket = tickets.find(t => t.eventName === TARGET_EVENT_NAME);
        
        if (activeTicket && user) {
            const payload = JSON.stringify({
                username: user.name,
                regNo: user.regNumber,
                ticketId: activeTicket._id,
                timestamp: new Date().toISOString()
            });

            QRCode.toDataURL(payload, { 
                width: 300, 
                color: { dark: '#00f2fe', light: '#00000000' } 
            }).then(setQrUrl);
        }
    }, [tickets, user]);

    const handleGetTickets = () => {
        router.push('/events');
    };

    // --- LOADING STATE ---
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#05070c]">
                <div className="animate-pulse text-cyan-400 font-mono text-xs">
                    SYSTEM_INITIALIZING...
                </div>
            </div>
        );
    }

    // --- NO USER STATE ---
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070c] text-white p-4">
                <h2 className="text-xl font-bold text-cyan-400 mb-4 tracking-tighter">SESSION_NOT_FOUND</h2>
                <button onClick={() => window.location.href = '/'} className="px-8 py-2 bg-white text-black font-bold rounded-full">
                    RETURN TO LOGIN
                </button>
            </div>
        );
    }

    const hasPaidTicket = tickets.some(t => t.eventName === TARGET_EVENT_NAME);

    return (
        <div className="min-h-screen bg-[#05070c] text-slate-200 font-sans">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <p className="text-cyan-400 font-mono text-sm mb-2 tracking-[0.2em]">COMMAND_CENTER</p>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Welcome, {user.name.split(' ')[0]}
                        </h1>
                    </div>

                    {/* GET TICKETS BUTTON (Only visible if no ticket) */}
                    {!hasPaidTicket && (
                        <button
                            onClick={handleGetTickets}
                            className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform"
                        >
                            Get Event Pass
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: QR / ID CARD */}
                    <div className="lg:col-span-4 group">
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-2xl transition-all group-hover:border-cyan-500/30">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative p-2 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                                    <div className={`relative z-10 w-56 h-56 flex items-center justify-center transition-all ${!hasPaidTicket ? 'blur-xl opacity-30' : 'opacity-100'}`}>
                                        {qrUrl ? <img src={qrUrl} alt="Access QR" className="w-full h-full" /> : <div className="w-full h-full bg-slate-800 animate-pulse" />}
                                    </div>
                                    {!hasPaidTicket && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                                            <span className="bg-black/80 border border-white/20 px-4 py-2 rounded-full text-xs font-bold tracking-widest text-cyan-400 uppercase">Access Locked</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 space-y-1">
                                    <p className="text-xl font-medium tracking-tight">{user.regNumber || 'N/A'}</p>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">{user.userType || 'MEMBER'} LEVEL</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: STATUS & TIMELINE */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-slate-500 text-xs mb-1 uppercase tracking-tighter">Status</p>
                                <p className={`text-lg font-bold ${hasPaidTicket ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {hasPaidTicket ? '✓ VERIFIED' : 'PENDING_PASS'}
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-slate-500 text-xs mb-1 uppercase tracking-tighter">Entry</p>
                                <p className="text-lg font-bold text-white uppercase">
                                    {tickets.some(t => t.isUsed) ? 'CHECKED_IN' : 'READY'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em]">Timeline</h3>
                            <div className="grid gap-4">
                                {CONCLAVES.map((event) => (
                                    <div key={event.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group">
                                        <div className="flex gap-6 items-center">
                                            <div className="text-center border-r border-white/10 pr-6">
                                                <p className="text-xl font-black">{event.displayDate}</p>
                                                <p className="text-[10px] text-cyan-400 font-bold tracking-tighter">FEB 2026</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg group-hover:text-cyan-400 transition-colors tracking-tight">{event.title}</h4>
                                                <p className="text-xs text-slate-500 font-mono">{event.venue}</p>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
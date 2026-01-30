"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Ticket, Loader2 } from "lucide-react";
import apiClient from "../lib/api-client";

const EVENT_DATA = {
    id: "mes-conclave-2026",
    title: "MES Conclave 2026",
    price: 499,
    date: "Feb 12-14, 2026",
    venue: "MIT Campus, Manipal",
    description: "Join us for a 3-day immersive experience exploring the future of AI, FinTech, and Entrepreneurship.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000"
};

export default function EventsPage() {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    // Inside handleBuyTicket function...

    const handleBuyTicket = async () => {
      setIsProcessing(true);
      try {
          // 1. Get Payment Params from Backend
          const response = await apiClient.post('/payment/initiate', {
              eventName: EVENT_DATA.title,
              amount: EVENT_DATA.price
          });

          const { success, data } = response.data;

          if (success && data) {
              // 2. Create a Hidden Form & Submit
              const form = document.createElement("form");
              form.method = "POST";
              form.action = data.url;

              // Add all parameters as hidden inputs
              Object.keys(data.params).forEach((key) => {
                  const input = document.createElement("input");
                  input.type = "hidden";
                  input.name = key;
                  input.value = data.params[key];
                  form.appendChild(input);
              });

              document.body.appendChild(form);
              form.submit(); // 🚀 Redirects to Atom
          } else {
              alert("Failed: " + response.data.message);
              setIsProcessing(false);
          }
      } catch (error) {
          console.error(error);
          alert("Payment Init Failed");
          setIsProcessing(false);
      }
  };

    return (
        <div className="min-h-screen bg-[#05070c] text-slate-200 p-6 md:p-10 font-sans relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-8 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                <header className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Upcoming <span className="text-cyan-400">Events</span>
                    </h1>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    <div className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all flex flex-col md:flex-row">
                        <div className="w-full md:w-2/5 h-64 md:h-auto bg-slate-900 relative">
                            <img src={EVENT_DATA.image} alt="Event" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition duration-500 mix-blend-overlay" />
                        </div>

                        <div className="p-8 flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">{EVENT_DATA.title}</h2>
                                    <span className="text-xl font-bold text-emerald-400">₹{EVENT_DATA.price}</span>
                                </div>
                                <p className="text-slate-400 leading-relaxed mb-6">{EVENT_DATA.description}</p>
                                <div className="flex gap-4 text-sm text-slate-300 font-mono mb-8">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Calendar className="w-4 h-4 text-cyan-400" /> {EVENT_DATA.date}</div>
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><MapPin className="w-4 h-4 text-purple-400" /> {EVENT_DATA.venue}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-6">
                                <span className="text-xs text-slate-500 uppercase tracking-widest">Secure Payment via Atom</span>
                                <button 
                                    onClick={handleBuyTicket}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-cyan-400 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg"
                                >
                                    {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting...</> : <><Ticket className="w-5 h-5" /> Buy Ticket</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
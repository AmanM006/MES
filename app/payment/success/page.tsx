"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import apiClient from "@/app/lib/api-client";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticketId");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      // Optional: Verify status from backend to be sure
      apiClient.get(`/payment/status/${ticketId}`)
        .then(() => {
           localStorage.setItem("hasTicket", "true"); // Unlock dashboard
           setLoading(false);
        })
        .catch((err) => console.error(err));
    }
  }, [ticketId]);

  return (
    <div className="min-h-screen bg-[#05070c] flex items-center justify-center p-4">
      <div className="bg-[#10141d] border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        
        {loading ? (
            <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-white">Verifying Payment...</h2>
            </div>
        ) : (
            <>
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                <p className="text-slate-400 mb-8">
                    Your ticket has been generated. You can now access your QR code on the dashboard.
                </p>
                <button
                    onClick={() => router.push('/student')}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition"
                >
                    Go to Dashboard
                </button>
            </>
        )}
      </div>
    </div>
  );
}
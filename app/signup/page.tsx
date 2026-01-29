'use client';

import dynamic from 'next/dynamic';

const ColorBends = dynamic(() => import('../components/ColorBends'), {
  ssr: false,
});

export default function Page() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background */}
      <ColorBends
        colors={['#ff5c7a', '#8a5cff', '#00ffd1']}
        speed={0.2}
        scale={1}
        frequency={1}
        warpStrength={1}
        mouseInfluence={1}
        parallax={0.5}
        noise={0.1}
        transparent={false}
      />

      {/* Registration Card */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-md bg-white/40 backdrop-blur-3xl rounded-3xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-6">
            MES <span className="text-blue-600">Registration</span>
          </h1>

          <form className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full rounded-xl px-4 py-2 bg-white/70 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Registration Number
              </label>
              <input
                type="text"
                placeholder="MES123456"
                className="w-full rounded-xl px-4 py-2 bg-white/70 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-xl px-4 py-2 bg-white/70 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-2 bg-white/70 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-4 rounded-xl bg-blue-600 text-white py-2 font-semibold hover:bg-blue-700 transition"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

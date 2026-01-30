"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import GlassSurface from "@/components/GlassSurface";

interface NavLink {
  name: string;
  href: string;
  type: "anchor" | "route";
}

const Navbar: React.FC = () => {
  const navLinks: NavLink[] = [
    { name: "Speakers", href: "/#speakers", type: "anchor" },
    { name: "Events", href: "/#events", type: "anchor" },
    { name: "Timeline", href: "/#timeline", type: "anchor" },
    { name: "Passes", href: "/signup", type: "route" },
  ];

  return (
    <nav className="fixed top-4 left-0 w-full z-[9999] pointer-events-none">
      
      {/* LEFT LOGO */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-auto">
        <Link href="/" className="text-2xl font-black tracking-tighter text-white">
          MES<span className="text-red-600">2026</span>
        </Link>
      </div>

      {/* CENTER GLASS PILL */}
      <div className="flex justify-center pointer-events-auto">
        <GlassSurface
          width={400}                 // ✅ FIXED WIDTH
          height={56}
          borderRadius={999}
          blur={12}
          brightness={30}             // 🔥 DARKER GLASS
          opacity={0.75}              // 🔥 LESS WHITE
          backgroundOpacity={0.12}
          saturation={1.1}
        >
          <div className="flex items-center justify-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="
                  text-xs uppercase tracking-widest 
                  text-black/80        // ✅ DARK TEXT
                  hover:text-black 
                  font-semibold
                  transition-colors
                "
              >
                {link.name}
              </Link>
            ))}
          </div>
        </GlassSurface>
      </div>

      {/* RIGHT CTA */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-auto">
        <Link href="/signup">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#dc2626", color: "#fff" }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black px-6 py-2 font-bold uppercase text-xs tracking-tight rounded-sm"
          >
            Get Funding
          </motion.button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

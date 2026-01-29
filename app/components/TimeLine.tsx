'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- COLOR PALETTE ---
const COLORS = {
  bg: "#1B1F23",        
  cardBg: "#3D1E42",    
  lineMain: "#EA5297",  
  lineDark: "#D60B68",  
  textLight: "#FFD9DA", 
  textWhite: "#ffffff",
};

// --- DATA ---
const EVENT_GROUPS = [
  {
    name: "Conceptiō",
    tag: "Flagship",
    rounds: [
      { date: "11 Dec - 07 Jan", title: "Ideation Round", desc: "Pitch Deck submission (8-10 slides). Focus on Innovation & Impact." },
      { date: "11 Jan - 27 Jan", title: "PoC Workshop", desc: "Exclusive workshop to build a working prototype/mock-up." },
      { date: "07 Feb", title: "Final Pitching", desc: "7-minute pitch to judges on Market Viability & Real-world Impact." }
    ]
  },
  {
    name: "Pitch Tank",
    tag: "Flagship",
    rounds: [
      { date: "16 Dec - 05 Jan", title: "Startup Submission", desc: "Submit detailed applications showcasing business models." },
      { date: "08 Jan - 20 Jan", title: "Video & Deck", desc: "Submit 3-min pitch video and 8-10 slide deck." },
      { date: "13 Feb - 14 Feb", title: "Offline Pitching", desc: "Pitch to VCs and Industry Leaders in person." }
    ]
  },
  {
    name: "Blindspot",
    tag: "Case Study",
    rounds: [
      { date: "26 Jan - 31 Jan", title: "Screening Desk", desc: "Identify key risks from a concise startup snapshot." },
      { date: "02 Feb - 07 Feb", title: "Financials", desc: "Deep dive into financial performance and risk reprioritization." },
      { date: "11 Feb", title: "The Verdict", desc: "Diagnose root causes and design corrective actions." }
    ]
  },
  {
    name: "Case Maze",
    tag: "Strategy",
    rounds: [
      { date: "27 Jan - 30 Jan", title: "Elimination Quiz", desc: "Online MCQs on Finance, Business, and Logic." },
      { date: "01 Feb - 08 Feb", title: "Case Submission", desc: "Submit solution presentation for a functional area challenge." },
      { date: "14 Feb", title: "Final Pitch", desc: "Present strategy to expert panel." }
    ]
  },
  {
    name: "Money Quest",
    tag: "Fun",
    rounds: [
      { date: "06 Feb - 07 Feb", title: "Quiz Round", desc: "Online finance quiz. Top 20 qualify." },
      { date: "09 Feb", title: "The Auction", desc: "Treasure hunt + Strategic Auction. Earn rent from places you own." }
    ]
  },
  {
    name: "PostMortem",
    tag: "Mystery",
    rounds: [
      { date: "05 Feb - 08 Feb", title: "Qualification Quiz", desc: "Online murder mystery reasoning test." },
      { date: "11 Feb", title: "The Deduction", desc: "Solve the CEO's murder using deduction and strategy." }
    ]
  }
];

export default function MESTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // 1. Line Animation
      gsap.fromTo(lineRef.current, 
        { height: "0%" },
        { 
          height: "100%", 
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top center", 
            end: "bottom center", 
            scrub: 1, 
          }
        }
      );

      // 2. Card/Dot Animation
      const groups = gsap.utils.toArray('.timeline-group');
      groups.forEach((group: any) => {
        const dot = group.querySelector('.timeline-dot');
        const card = group.querySelector('.timeline-card');

        gsap.fromTo(dot,
          { scale: 0, opacity: 0 },
          { 
            scale: 1, 
            opacity: 1, 
            duration: 0.4, 
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: group,
              start: "top 60%", 
              toggleActions: "play reverse play reverse"
            }
          }
        );

        gsap.fromTo(card, 
          { opacity: 0, x: 20 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.6, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: group,
              start: "top 70%",
              toggleActions: "play reverse play reverse"
            }
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      
      <div ref={containerRef} className="relative max-w-5xl mx-auto py-24 px-4 overflow-hidden">
        
        {/* --- THE LINE --- */}
        {/* Mobile: Left aligned (left-8) | Desktop: Center aligned (md:left-1/2) */}
        <div className="absolute top-0 left-8 md:left-1/2 -translate-x-1/2 w-1 h-full z-0 opacity-20"
             style={{ backgroundColor: COLORS.textLight }}></div>

        <div ref={lineRef}
             className="absolute top-0 left-8 md:left-1/2 -translate-x-1/2 w-1 z-0 shadow-[0_0_15px_rgba(234,82,151,0.8)]"
             style={{ 
               background: `linear-gradient(to bottom, ${COLORS.lineMain}, ${COLORS.lineDark})`,
               height: "0%"
             }}>
        </div>

        {/* --- EVENT GROUPS --- */}
        <div className="flex flex-col gap-12 md:gap-24 relative z-10 pt-10">
          {EVENT_GROUPS.map((event, i) => (
            <div 
              key={i} 
              // Mobile: Always flex-row. Desktop: Alternating flex-row / flex-row-reverse
              className={`timeline-group flex w-full items-start relative ${
                i % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* 1. The Dot */}
              {/* Mobile: Left aligned (left-8) | Desktop: Center aligned (md:left-1/2) */}
              <div 
                className="timeline-dot absolute left-8 md:left-1/2 -translate-x-1/2 top-0 w-6 h-6 rounded-full border-4 z-20 shadow-[0_0_20px_rgba(234,82,151,0.8)]"
                style={{ 
                  backgroundColor: COLORS.bg, 
                  borderColor: COLORS.lineMain 
                }}
              />

              {/* 2. The Card */}
              {/* Mobile: Full width, pushed right (ml-16). Desktop: 45% width, margin reset. */}
              <div 
                className={`timeline-card w-full ml-16 md:ml-0 md:w-[45%] ${
                  i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'
                } text-left`}
              >
                
                {/* Event Name Tag */}
                <div 
                  className={`inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 shadow-lg ${
                    // Mobile: Always left. Desktop: Alternates
                    i % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'
                  }`}
                  style={{ backgroundColor: COLORS.lineMain, color: "#000" }}
                >
                  {event.name}
                </div>

                {/* The Box */}
                <div 
                  className="rounded-2xl p-6 border backdrop-blur-sm transition-all hover:shadow-[0_0_30px_rgba(61,30,66,0.6)] group"
                  style={{ 
                    backgroundColor: `${COLORS.cardBg}E6`, 
                    borderColor: COLORS.cardBg,
                    // Mobile: Always Left Border. Desktop: Alternating borders.
                    borderLeft: `4px solid ${COLORS.lineMain}`,
                    // We override the inline style for desktop using a style object, but doing it via logic is cleaner:
                  }}
                >
                  {/* Internal Rounds List */}
                  <div className="flex flex-col gap-6">
                    {event.rounds.map((round, r) => (
                      <div key={r} className="border-b border-white/10 last:border-0 pb-4 last:pb-0">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs opacity-70" style={{ color: COLORS.textLight }}>
                            {round.date}
                          </span>
                          <h4 className="text-xl font-bold text-white group-hover:text-[#EA5297] transition-colors">
                            {round.title}
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {round.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
              {/* 3. Spacer (Hidden on Mobile) */}
              <div className="hidden md:block w-[45%]"></div> 
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
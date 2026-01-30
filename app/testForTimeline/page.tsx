import MESTimeline from '../../components/TimeLine';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1B1F23]">
      
      {/* Header Section */}
      <section className="h-[40vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-4">
          MES <span className="text-[#EA5297]">2026</span>
        </h1>
        <p className="text-[#FFD9DA] text-xl max-w-2xl">
          Manipal Entrepreneurship Summit Timeline
        </p>
      </section>

      {/* The Timeline */}
      <section id="timeline">
        <MESTimeline />
      </section>

      <div className="h-20" /> {/* Spacer */}
    </main>
  );
}
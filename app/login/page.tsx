"use client";

import { useState, ChangeEvent, FormEvent, JSX } from "react";
import { useRouter } from "next/navigation";

const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1558655146-d09347e92766",
  "https://images.unsplash.com/photo-1605379399642-870262d3d051",
  "https://images.unsplash.com/photo-1517433456452-f9633a875f6f",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
];

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ FIX: Pointing to port 8080 (Your Backend) instead of 3000
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
      }
    } catch (error) {
      console.error("Login Error:", error);
      // Helpful error message telling you exactly what to check
      setError("Connection error: Ensure backend is running on port 8080");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      
      {/* BACKGROUND WALL */}
      <div className="wall">
        <Row direction="left" />
        <Row direction="right" />
        <Row direction="left" />
        <Row direction="right" />
      </div>

      {/* LOGIN FORM */}
      <div className="focus">
        <form className="login-box" onSubmit={handleLogin}>
          <div className="header">
            <h2>Sign in</h2>
            <p className="subtitle">Welcome back! Please enter your details.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => { setEmail(e.target.value); setError(null); }} 
              required
            />
          </div>
          
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); setError(null); }} 
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>

      <style jsx>{`
        /* --- LAYOUT --- */
        .page-wrapper {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: #050505;
          font-family: sans-serif;
        }

        /* --- BACKGROUND WALL --- */
        .wall {
          position: absolute;
          inset: 0;
          z-index: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.5rem;
          opacity: 0.3;
          pointer-events: none; /* Allows clicks to pass through to form */
        }

        .row { display: flex; width: 100%; overflow: hidden; }
        .track { display: flex; gap: 1.5rem; width: max-content; }
        .track.left { animation: slideLeft 60s linear infinite; }
        .track.right { animation: slideRight 60s linear infinite; }

        @keyframes slideLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes slideRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }

        img {
          width: 250px;
          height: 160px;
          object-fit: cover;
          border-radius: 12px;
          filter: grayscale(100%);
          opacity: 0.6;
        }

        /* --- FORM CONTAINER --- */
        .focus {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }

        /* --- LOGIN CARD UI --- */
        .login-box {
          background: rgba(30, 30, 30, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 2.5rem;
          border-radius: 1rem;
          width: 100%;
          max-width: 400px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        h2 {
          color: white;
          font-size: 2rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .subtitle {
          color: #888;
          font-size: 0.9rem;
          margin: 0;
        }

        .input-group input {
          width: 100%;
          padding: 1rem;
          border-radius: 0.5rem;
          border: none;
          background: #2A2A2A;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        .input-group input:focus {
          background: #333;
          box-shadow: 0 0 0 2px #6d28d9;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          border-radius: 0.5rem;
          border: none;
          background: #6d28d9;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 0.5rem;
        }

        .submit-btn:hover {
          background: #5b21b6;
        }

        .submit-btn:disabled {
          background: #4b5563;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(220, 38, 38, 0.2);
          color: #fca5a5;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          text-align: center;
          border: 1px solid rgba(220, 38, 38, 0.5);
        }
      `}</style>
    </div>
  );
}

/* --- COMPONENTS --- */

function Row({ direction }: { direction: "left" | "right" }) {
  const renderImages = (suffix: string) => 
    IMAGE_URLS.map((src, i) => (
      <img 
        key={`${suffix}-${i}`} 
        src={`${src}?auto=format&fit=crop&w=500&q=80`} 
        alt="" 
      />
    ));

  return (
    <div className="row">
      <div className={`track ${direction}`}>
        {renderImages("a")}
        {renderImages("b")}
        {renderImages("c")}
      </div>
    </div>
  );
}
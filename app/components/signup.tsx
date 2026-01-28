import React from "react";

const Signup: React.FC = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center
      bg-[radial-gradient(circle_at_center,_#E91E63_0%,_#3a0d1f_60%,_#000000_70%)]"
    >
      {/* Card */}
      <div className="w-full max-w-md bg-pink-100 rounded-2xl shadow-xl p-10 border border-pink-100">
        
        {/* Heading */}
        <h1 className="text-3xl font-semibold text-center text-[#3E1F3D] mb-2">
          Sign Up
        </h1>

        <p className="text-center text-sm text-gray-500 mb-8">
          Create your account to get started
        </p>

        {/* Form */}
        <form className="space-y-5">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#3E1F3D] mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-sm font-medium text-[#3E1F3D] mb-1">
              Registration Number
            </label>
            <input
              type="text"
              placeholder="e.g. 22BCS1234"
              className="w-full px-4 py-3 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-[#3E1F3D] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-3 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>

          {/* Personal Email */}
          <div>
            <label className="block text-sm font-medium text-[#3E1F3D] mb-1">
              Personal Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg bg-[#E91E63] text-white
            font-semibold text-lg hover:bg-[#D81B60]
            transition duration-200"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;

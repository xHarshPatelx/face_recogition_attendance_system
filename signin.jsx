import React, { useState } from "react";
import { Link } from "react-router-dom";

const Signin = ({ classname }) => {
    const [authMode, setAuthMode] = useState("login");
    const handleSignup = async () => {
        const username = document.querySelector("#signup-username").value;
        const email = document.querySelector("#signup-email").value;
        const password = document.querySelector("#signup-password").value;
        const retypePassword = document.querySelector("#signup-retype").value;

        if (password !== retypePassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Signup successful!");
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Something went wrong!");
            console.error(err);
        }
    };

    const handleSignin = async () => {
        const emailOrUsername = document.querySelector("#signin-email").value;
        const password = document.querySelector("#signin-password").value;

        try {
            const response = await fetch("http://localhost:5001/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: emailOrUsername,
                    password,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Signin successful!");

                window.location.href = "/dashboard";
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Signin failed!");
            console.error(err);
        }
    };


    return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f172a] to-[#1e1b4b] px-6">

    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex flex-col justify-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10">
        
        <h1 className="text-4xl font-bold mb-4 text-white">
           Face Recognition <br />
           Attendance System
        </h1>

        <p className="text-gray-400 mb-6">
          Admin panel to manage students, attendance, and AI-based face recognition system.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-300 text-sm">
            Manage student data, track attendance in real-time, and monitor class performance efficiently.
          </p>
        </div>

      </div>

      {/* RIGHT SIDE (FORM) */}
      <div className="flex items-center justify-center">

        <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">

          <h2 className="text-2xl font-bold mb-2 text-white">
              {authMode === "login" ? "Admin Login" : "Admin Signup"}
          </h2>

          <p className="text-gray-400 text-sm mb-6">Select Mode</p>

          {/* TOGGLE */}
          <div className="flex mb-6 bg-black/40 rounded-xl p-1">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 rounded-lg transition ${
                authMode === "login" ? "bg-indigo-500 text-white" : "text-gray-400"
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-2 rounded-lg transition ${
                authMode === "signup" ? "bg-indigo-500 text-white" : "text-gray-400"
              }`}
            >
              Signup
            </button>
          </div>

          {/* FORM */}
          {authMode === "login" ? (
            <>
              <input
                id="signin-email"
                placeholder="Email or Username"
                className="input-style mb-4"
              />

              <input
                type="password"
                id="signin-password"
                placeholder="Password"
                className="input-style mb-6"
              />

              <button
                onClick={handleSignin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              <input id="signup-username" placeholder="Username" className="input-style mb-3" />
              <input id="signup-email" placeholder="Email" className="input-style mb-3" />
              <input type="password" id="signup-password" placeholder="Password" className="input-style mb-3" />
              <input type="password" id="signup-retype" placeholder="Retype Password" className="input-style mb-6" />

              <button
                onClick={handleSignup}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition"
              >
                Sign Up
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  </div>
);
};

export default Signin;

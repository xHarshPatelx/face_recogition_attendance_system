import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaHome, FaFileAlt, FaUser, FaDownload, FaClock, FaChartLine,FaExclamationTriangle, FaCheckCircle,FaChartBar } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PredictionDashboard = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndPredict = async () => {
      try {
        // 1. Fetch raw data from Node.js MongoDB backend
        const [studentsRes, attendanceRes] = await Promise.all([
          axios.get('http://localhost:5001/api/students'),
          axios.get('http://localhost:5001/api/attendance')
        ]);

        // 2. Send data to Python Flask ML endpoint
        const predictRes = await axios.post('http://localhost:5000/predict_attendance', {
          students: studentsRes.data,
          attendance: attendanceRes.data
        });

        setPredictions(predictRes.data);
      } catch (error) {
        console.error("Error generating predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndPredict();
  }, []);

  const getBarColor = (probability) => {
    if (probability >= 75) return '#10B981'; // Green (Safe)
    if (probability >= 50) return '#F59E0B'; // Yellow (Warning)
    return '#EF4444'; // Red (At Risk)
  };

  const atRiskCount = predictions.filter(p => p.probability < 50).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f172a] to-[#1e1b4b] text-white flex">
      
      {/* SIDEBAR */}
      <div className="w-64 p-5 hidden lg:flex flex-col justify-between backdrop-blur-xl bg-white/5 border-r border-white/10">
        <div>
          <h2 className="text-2xl font-bold mb-10 text-center">Admin Panel</h2>
          <div className="flex flex-col gap-3">
                    <Link to="/dashboard"><button className="sidebar-btn"><FaHome /> Home</button></Link>
                    <Link to="/Addstudent"><button className="sidebar-btn"><FaUser /> Add Students</button></Link>
                    <Link to="/Enrolled"><button className="sidebar-btn"><FaFileAlt /> Enrolled</button></Link>
                    <Link to="/Period"><button className="sidebar-btn"><FaClock /> Period Wise</button></Link>
                    <Link to="/Predictions"><button className="sidebar-btn bg-white/10"><FaChartLine /> Predictions</button></Link>
                    <Link to="/Analysis"><button className="sidebar-btn"><FaChartBar /> Analysis</button></Link>
          </div>
        </div>
        <Link to="/signin">
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition">Logout</button>
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <p className="text-gray-400 text-sm">AI Analytics / Predictive Modeling</p>
          <h1 className="text-2xl font-bold">Tomorrow's Attendance Prediction</h1>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-gray-400">Students At Risk of Absence</p>
              <h2 className="text-3xl font-bold text-red-400">{atRiskCount}</h2>
            </div>
            <FaExclamationTriangle className="text-4xl text-red-500/50" />
          </div>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-gray-400">Safe Attendance Expected</p>
              <h2 className="text-3xl font-bold text-green-400">{predictions.length - atRiskCount}</h2>
            </div>
            <FaCheckCircle className="text-4xl text-green-500/50" />
          </div>
        </div>

        {/* CHART AREA */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Probability of Attendance by Student (%)</h2>
          
          {loading ? (
            <div className="h-72 flex items-center justify-center text-gray-400 animate-pulse">Running ML Model...</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={predictions} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#cbd5e1" />
                  <YAxis dataKey="name" type="category" stroke="#cbd5e1" width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4f46e5', borderRadius: '10px' }}
                    formatter={(value) => [`${value}%`, 'Likelihood to Attend']}
                  />
                  <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={20}>
                    {predictions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.probability)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PredictionDashboard;
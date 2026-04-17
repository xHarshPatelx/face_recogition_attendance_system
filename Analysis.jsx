import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaHome, FaFileAlt, FaUser, FaClock, FaChartBar, FaChartLine } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const Analysis = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, stuRes] = await Promise.all([
          axios.get('http://localhost:5001/api/attendance'),
          axios.get('http://localhost:5001/api/students')
        ]);
        setAttendance(attRes.data);
        setStudents(stuRes.data);
      } catch (err) {
        console.error("Error fetching data for analysis:", err);
      }
    };
    fetchData();
  }, []);

  // --- Data Processing for Charts ---

  // 1. Today's Present vs Absent (Pie Chart)
  const today = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter(log => new Date(log.recognizedAt).toISOString().split('T')[0] === today).length;
  const absentToday = students.length - presentToday;
  
  const pieData = [
    { name: 'Present', value: presentToday },
    { name: 'Absent', value: absentToday > 0 ? absentToday : 0 }
  ];
  const COLORS = ['#10B981', '#EF4444']; // Green for present, Red for absent

  // 2. Attendance by Branch (Bar Chart)
  const branchCounts = attendance.reduce((acc, log) => {
    acc[log.branch] = (acc[log.branch] || 0) + 1;
    return acc;
  }, {});
  const branchData = Object.keys(branchCounts).map(key => ({
    branch: key,
    count: branchCounts[key]
  }));

  // 3. Daily Attendance Trend (Line Chart)
  const dailyCounts = attendance.reduce((acc, log) => {
    const date = new Date(log.recognizedAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const trendData = Object.keys(dailyCounts)
    .map(date => ({ date, attendees: dailyCounts[date] }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort chronologically

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f172a] to-[#1e1b4b] text-white flex">
      
      {/* SIDEBAR */}
      <div className="w-64 p-5 hidden lg:flex flex-col justify-between backdrop-blur-xl bg-white/5 border-r border-white/10">
        <div>
          <h2 className="text-2xl font-bold mb-10 text-center">Admin Panel</h2>
          <div className="flex flex-col gap-3">
            {[
              { name: "Home", icon: <FaHome />, path: "/dashboard" },
              { name: "Add Students", icon: <FaUser />, path: "/Addstudent" },
              { name: "Enrolled", icon: <FaFileAlt />, path: "/Enrolled" },
              { name: "Period Wise", icon: <FaClock />, path: "/Period" },
              { name: "Predictions", icon: <FaChartLine />, path: "/Predictions" },
              { name: "Analysis", icon: <FaChartBar />, path: "/Analysis" }
              
            ].map((item, i) => (
              <Link to={item.path} key={i}>
                <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition ${item.name === "Analysis" ? "bg-white/10" : "hover:bg-white/10"}`}>
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
        <Link to="/signin">
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition">
            Logout
          </button>
        </Link>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <p className="text-gray-400 text-sm">Pages / Analysis</p>
          <h1 className="text-2xl font-bold">Attendance Analytics</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* PIE CHART - Today's Status */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Today's Attendance Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4f46e5' }} itemStyle={{ color: 'white' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR CHART - Branch Distribution */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Total Attendance by Branch</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="branch" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4f46e5' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* LINE CHART - Daily Trend */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Attendance Trend (Last 7 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="date" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4f46e5' }} />
                <Line type="monotone" dataKey="attendees" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analysis;
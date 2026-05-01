import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaClock, FaChartLine,FaChartBar } from 'react-icons/fa';
import { FaJava, FaPython, FaNetworkWired, FaBrain, FaReact } from "react-icons/fa";

const Period = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/periodwise-attendance");
        const data = await response.json();
        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  const periods = [
    { name: 'Java', icon: <FaJava className="text-3xl text-orange-600" />, time: '9:30 AM' },
    { name: 'Python', icon: <FaPython className="text-3xl text-blue-500" />, time: '10:30 AM' },
    { name: 'Network', icon: <FaNetworkWired className="text-3xl text-green-600" />, time: '12:30 AM' },
    { name: 'AI/ML', icon: <FaBrain className="text-3xl text-purple-700" />, time: '2:30 PM' },
    { name: 'React', icon: <FaReact className="text-3xl text-cyan-500" />, time: '3:30 PM' }
  ];

  const filteredData = filter
    ? attendanceData.filter((log) => log.period === filter)
    : attendanceData;

  return (
  <div className="min-h-screen bg-gradient-to-br from-black via-[#0f172a] to-[#1e1b4b] text-white flex">

    {/* SIDEBAR */}
    <div className="w-64 p-5 hidden lg:flex flex-col justify-between backdrop-blur-xl bg-white/5 border-r border-white/10">

      <div>
        <h2 className="text-2xl font-bold mb-10 text-center">Admin Panel</h2>

        <div className="flex flex-col gap-3">
          <Link to="/dashboard">
            <button className="sidebar-btn"><FaHome /> Home</button>
          </Link>

          <Link to="/Addstudent">
            <button className="sidebar-btn"><FaUser /> Add Students</button>
          </Link>

          <Link to="/Enrolled">
            <button className="sidebar-btn"><FaFileAlt /> Enrolled</button>
          </Link>

          <Link to="/Period">
            <button className="sidebar-btn bg-white/10"><FaClock /> Period Wise</button>
          </Link>
          <Link to="/Predictions">
            <button className="sidebar-btn"><FaChartLine /> Predictions</button>
          </Link>
          <Link to="/Analysis">
            <button className="sidebar-btn"><FaChartBar /> Analysis</button>
          </Link>
        </div>
      </div>

      <Link to="/signin">
        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition">
          Logout
        </button>
      </Link>
    </div>

    {/* MAIN */}
    <div className="flex-1 p-6">

      {/* HEADER */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm">Pages / Period Wise</p>
        <h1 className="text-2xl font-bold">Period Attendance</h1>
      </div>

      {/* PERIOD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {periods.map((period, index) => {
          const count = attendanceData.filter(log => log.period === period.name).length;

          return (
            <div
              key={index}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:scale-105 transition"
            >
              <div className="flex items-center justify-between">
                {period.icon}
                <span className="text-3xl font-bold">{count}</span>
              </div>

              <div>
                <h2 className="text-lg font-semibold">{period.name}</h2>
                <p className="text-gray-400 text-sm">{period.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLE SECTION */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">

        {/* FILTER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Attendance Logs</h2>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/40 border border-white/20 px-3 py-2 rounded-lg text-sm"
          >
            <option value="">All</option>
            {periods.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* TABLE */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Enrollment</th>
                <th className="text-left py-2">Subject</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    Loading attendance data...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((log, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2">{log.name}</td>
                    <td>{log.enrollmentno}</td>
                    <td>{log.period}</td>
                    <td>{new Date(log.recognizedAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
);
};

export default Period;

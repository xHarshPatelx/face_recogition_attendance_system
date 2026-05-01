import "./App.css";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaChartLine,FaChartBar } from 'react-icons/fa';
import { FaUserGraduate, FaClipboardList, FaUsers, FaClock } from "react-icons/fa";
import { Link } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [attendance, setAttendance] = useState([]);
    const [students, setStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(4);
    const [selectedbranch, setSelectedbranch] = useState("All");

    const today = new Date().toISOString().split('T')[0];

    const presentToday = attendance.filter((student) => {
        const attendedDate = new Date(student.recognizedAt).toISOString().split('T')[0];
        return attendedDate === today;
    });

    const handleManualAttendance = async () => {
        const name = document.querySelector('input[name="manual_name"]').value;
        const enrollmentno = document.querySelector('input[name="manual_enrollmentno"]').value;
        const branch = document.querySelector('input[name="manual_branch"]').value;
        const recognizedAtInput = document.querySelector('input[name="recognizedAt"]').value;

        try {
            const res = await axios.post("http://localhost:5001/api/attendance", {
                name,
                enrollmentno,
                branch,
                recognizedAt: recognizedAtInput || undefined
            });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        }
    };

    const totalStudents = students.length;
    const absentStudents = totalStudents - presentToday.length;

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/attendance');
                setAttendance(response.data);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            }
        };

        const fetchStudents = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/students');
                setStudents(response.data);
            } catch (err) {
                console.error("Error fetching students:", err);
            }
        };

        fetchAttendance();
        fetchStudents();
    }, []);

    // --- Add this function inside your Dashboard component ---
  const downloadCSV = () => {
    if (attendance.length === 0) {
      alert("No attendance data to export!");
      return;
    }

    // 1. Define the CSV headers
    const headers = ["Name", "Enrollment No", "Branch", "Date", "Time"];

    // 2. Map through the attendance data and format each row
    const csvRows = attendance.map(log => {
      const dateObj = new Date(log.recognizedAt);
      // We wrap values in quotes to prevent issues with commas inside the data
      return [
        `"${log.name}"`,
        `"${log.enrollmentno}"`,
        `"${log.branch}"`,
        `"${dateObj.toLocaleDateString()}"`,
        `"${dateObj.toLocaleTimeString()}"`
      ].join(",");
    });

    // 3. Combine headers and rows with newlines
    const csvString = [headers.join(","), ...csvRows].join("\n");

    // 4. Create a Blob (a file-like object) and trigger the download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary hidden anchor tag to click
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Attendance_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

    const branchList = ["All", ...new Set(attendance.map((student) => student.branch))];

    const filteredAttendance = selectedbranch === "All"
        ? attendance
        : attendance.filter((student) => student.branch === selectedbranch);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAttendance = filteredAttendance.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
              <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 transition">
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

    {/* MAIN */}
    <div className="flex-1 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-gray-400 text-sm">Pages / Dashboard</p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        {/* New Export Button */}
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/30 transition shadow-lg"
        >
          <FaDownload />
          <span>Export CSV</span>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* CARD */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Total Students</p>
            <h2 className="text-3xl font-bold">{totalStudents}</h2>
          </div>
          <FaUserGraduate className="text-3xl text-green-400" />
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Present Today</p>
            <h2 className="text-3xl font-bold">{presentToday.length}</h2>
          </div>
          <FaClipboardList className="text-3xl text-blue-400" />
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Absent Today</p>
            <h2 className="text-3xl font-bold">{absentStudents}</h2>
          </div>
          <FaUsers className="text-3xl text-red-400" />
        </div>

      </div>

      {/* TABLE + FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TABLE */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Attendance Logs</h2>

            <select
              value={selectedbranch}
              onChange={(e) => {
                setSelectedbranch(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-black/40 border border-white/20 px-3 py-2 rounded-lg text-sm"
            >
              {branchList.map((branch, idx) => (
                <option key={idx} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Enroll</th>
                  <th className="text-left py-2">Branch</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>

              <tbody>
                {currentAttendance.map((student, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2">{student.name}</td>
                    <td>{student.enrollmentno}</td>
                    <td>{student.branch}</td>
                    <td>{new Date(student.recognizedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* MANUAL FORM */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">

          <h2 className="text-lg font-semibold mb-4">Manual Attendance</h2>

          <div className="grid grid-cols-2 gap-4">
            <input name="manual_name" placeholder="Student Name" className="input-style" />
            <input name="manual_enrollmentno" placeholder="Enrollment No" className="input-style" />
            <input name="manual_branch" placeholder="Branch" className="input-style" />
            <input type="datetime-local" name="recognizedAt" className="input-style" />
          </div>

          <button
            onClick={handleManualAttendance}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition"
          >
            Mark Attendance
          </button>

        </div>

      </div>

      {/* PAGINATION */}
      <div className="mt-6 text-center text-gray-400">
        <span
          onClick={() => currentPage > 1 && paginate(currentPage - 1)}
          className="cursor-pointer mr-4 hover:text-white"
        >
          Prev
        </span>

        <span className="text-white font-semibold">Page {currentPage}</span>

        <span
          onClick={() => indexOfLastItem < filteredAttendance.length && paginate(currentPage + 1)}
          className="cursor-pointer ml-4 hover:text-white"
        >
          Next
        </span>
      </div>

    </div>
  </div>
);
};
export default Dashboard;

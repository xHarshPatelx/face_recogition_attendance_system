import "./App.css";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect } from 'react';

const Enrolled = () => {
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      try {
        const [studentsRes, attendanceRes] = await Promise.all([
          axios.get('http://localhost:5001/api/students'),
          axios.get('http://localhost:5001/api/attendance'),
        ]);

        setStudents(studentsRes.data);
        setAttendanceLogs(attendanceRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchStudentsAndAttendance();
  }, []);

  const todayDate = new Date().toISOString().split("T")[0];

  const getAttendanceStatus = (enrollmentno) => {
    const hasLogToday = attendanceLogs.some(log => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return log.enrollmentno === enrollmentno && logDate === todayDate;
    });
    return hasLogToday ? "Present" : "Absent";
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);

    if (!query) {
      setFilteredSuggestions([]);
    } else {
      const suggestions = students.filter((student) => {
        const nameMatch = student.name?.toLowerCase().includes(query);
        const enrollmentnoMatch = student.enrollmentno?.toLowerCase().includes(query);
        return nameMatch || enrollmentnoMatch;
      });
      setFilteredSuggestions(suggestions);
    }
  };

  const handleSuggestionClick = (student) => {
    setSelectedStudent(student);
    setSearch('');
    setFilteredSuggestions([]);
  };

  const closeModal = () => setSelectedStudent(null);

  return (
  <div className="min-h-screen bg-gradient-to-br from-black via-[#0f172a] to-[#1e1b4b] text-white flex">

    {/* MODAL */}
    {selectedStudent && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 w-[22rem] relative">
          
          <button
            onClick={closeModal}
            className="absolute top-2 right-3 text-xl text-gray-400 hover:text-white"
          >
            &times;
          </button>

          <h2 className="text-lg font-semibold mb-4">Student Details</h2>

          <div className="space-y-2 text-sm text-gray-300">
            <p><span className="text-gray-400">Name:</span> {selectedStudent.name}</p>
            <p><span className="text-gray-400">Enrollment:</span> {selectedStudent.enrollmentno}</p>
            <p><span className="text-gray-400">Sem:</span> {selectedStudent.sem}</p>
            <p><span className="text-gray-400">Branch:</span> {selectedStudent.branch}</p>
            <p><span className="text-gray-400">Phone:</span> {selectedStudent.phone}</p>
            <p><span className="text-gray-400">Enrolled At:</span> {new Date(selectedStudent.enrolledAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    )}

    {/* SIDEBAR */}
    <div className="w-64 p-5 hidden lg:flex flex-col justify-between backdrop-blur-xl bg-white/5 border-r border-white/10">

      <div>
        <h2 className="text-2xl font-bold mb-10 text-center">Admin Panel</h2>

        <div className="flex flex-col gap-3">
          <Link to="/dashboard"><button className="sidebar-btn"><FaHome /> Home</button></Link>
          <Link to="/Addstudent"><button className="sidebar-btn"><FaUser /> Add Students</button></Link>
          <Link to="/Enrolled"><button className="sidebar-btn bg-white/10"><FaFileAlt /> Enrolled</button></Link>
          <Link to="/Period"><button className="sidebar-btn"><FaClock /> Period Wise</button></Link>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <p className="text-gray-400 text-sm">Pages / Enrolled</p>
          <h1 className="text-2xl font-bold">Enrolled Students</h1>
        </div>

        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={handleSearchChange}
            className="input-style"
          />

          {filteredSuggestions.length > 0 && (
            <div className="absolute w-full mt-2 bg-black/80 border border-white/10 rounded-xl backdrop-blur-lg z-10 max-h-60 overflow-auto">
              {filteredSuggestions.map((student) => (
                <div
                  key={student._id}
                  onClick={() => handleSuggestionClick(student)}
                  className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm"
                >
                  {student.name} ({student.enrollmentno})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">

        <h2 className="text-lg font-semibold mb-4">Student List</h2>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Enrollment</th>
                <th className="text-left py-2">Sem</th>
                <th className="text-left py-2">Branch</th>
                <th className="text-left py-2">Phone</th>
                <th className="text-left py-2">Enrolled</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr
                    key={student._id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="py-2">{student.name}</td>
                    <td>{student.enrollmentno}</td>
                    <td>{student.sem}</td>
                    <td>{student.branch}</td>
                    <td>{student.phone}</td>
                    <td>{new Date(student.enrolledAt).toLocaleDateString()}</td>
                    <td>
                      <span className={
                        getAttendanceStatus(student.enrollmentno) === "Present"
                          ? "text-green-400 font-semibold"
                          : "text-red-400 font-semibold"
                      }>
                        {getAttendanceStatus(student.enrollmentno)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-400">
                    No students enrolled.
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

export default Enrolled;

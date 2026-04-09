import "./App.css";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';

const Addstudent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [student, setStudent] = useState({
    name: '',
    enrollmentno: '',
    sem: '',
    branch: '',
    phone: ''
  });

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    };

    getCameraStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const captureAndSend = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!student.name || !student.enrollmentno || !student.sem || !student.branch || !student.phone) {
      alert("Please fill in all student details.");
      return;
    }

    if (video && canvas) {
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg');

      try {
        const response = await fetch('http://localhost:5000/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollmentno: student.enrollmentno, image: imageData })
        });

        const result = await response.json();
        alert(result.message);

        const dataResponse = await fetch('http://localhost:5001/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student)
        });

        const dataResult = await dataResponse.json();
        console.log('Student DB response:', dataResult.message);

        alert('Student enrolled successfully!');
        setStudent({ name: '', sem: '', branch: '', phone: '', enrollmentno: '' });

      } catch (err) {
        console.error('Error sending data to backend:', err);
        alert("Failed to enroll face.");
      }
    }
  };

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
            <button className="sidebar-btn bg-white/10"><FaUser /> Add Students</button>
          </Link>

          <Link to="/Enrolled">
            <button className="sidebar-btn"><FaFileAlt /> Enrolled</button>
          </Link>

          <Link to="/Period">
            <button className="sidebar-btn"><FaClock /> Period Wise</button>
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
        <p className="text-gray-400 text-sm">Pages / Add Student</p>
        <h1 className="text-2xl font-bold">Enroll New Student</h1>
      </div>

      {/* FORM + CAMERA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* FORM */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">

          <h2 className="text-lg font-semibold mb-4">Student Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="name" value={student.name} onChange={handleChange} placeholder="Student Name" className="input-style" />
            <input name="enrollmentno" value={student.enrollmentno} onChange={handleChange} placeholder="Enrollment No" className="input-style" />
            <input name="sem" value={student.sem} onChange={handleChange} placeholder="Semester" className="input-style" />
            <input name="branch" value={student.branch} onChange={handleChange} placeholder="Branch" className="input-style" />
            <input name="phone" value={student.phone} onChange={handleChange} placeholder="Phone Number" className="input-style col-span-2" />
          </div>

        </div>

        {/* CAMERA */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center">

          <h2 className="text-lg font-semibold mb-4">Face Capture</h2>

          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
          </div>

          <p className="text-gray-400 mt-4 text-sm">
            Align face properly before capturing
          </p>

          <button
            onClick={captureAndSend}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition"
          >
            Enroll Face
          </button>

        </div>

      </div>

    </div>
  </div>
);
};
export default Addstudent;

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';

const Front = () => {
  const [recognizedName, setRecognizedName] = useState("Enrollment number will appear here");
  const [recognizedStudentName, setRecognizedStudentName] = useState("Name will appear here");
  const [attendanceMessage, setAttendanceMessage] = useState(""); 
  const [students, setStudents] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/students");
        setStudents(response.data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    getCamera();
  }, []);

  const handleRecognize = async () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");
  
    try {
      const response = await axios.post("http://localhost:5000/recognize", { image: imageData });
      const enrollmentno = response.data.enrollmentno;
  
      setRecognizedName(enrollmentno);
  
      const matchedStudent = students.find((student) => student.enrollmentno === enrollmentno);
      if (matchedStudent) {
        setRecognizedStudentName(matchedStudent.name);
      } else {
        setRecognizedStudentName("Not found");
      }
  
      const recognizedAt = new Date().toISOString(); // Always send recognizedAt
      const currentPeriod = getCurrentPeriod();
  
      if (currentPeriod === 'No Period') {
        setAttendanceMessage("Attendance cannot be recorded outside of class periods.");
        return;
      }
  
      // Submit period-wise attendance
      try {
        const res = await axios.post("http://localhost:5001/api/periodwise-attendance", {
          enrollmentno,
          recognizedAt
        });
        toast.success(res.data.message);
        setAttendanceMessage(`${currentPeriod} attendance successfully recorded.`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Something went wrong");
        setAttendanceMessage("Failed to record attendance.");
      }
  
    } catch (err) {
      console.error(err);
      setRecognizedName("Error recognizing");
      setRecognizedStudentName("Recognition failed");
      setAttendanceMessage("Error in recognition or attendance.");
    }
  };
  
  

function getCurrentPeriod() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours >= 9 && minutes >= 30) {
    return 'Java';
  } else if (hours === 10 && minutes >= 30) {
    return 'Python';
  } else if (hours === 12 && minutes >= 30) {
    return 'Networking';
  } else if (hours === 14 && minutes >= 30) {
    return 'AI/ML';
  } else if (hours === 15 && minutes >= 30 || (hours === 15 && minutes < 60)) {
    return 'React'; 
  }
  return 'No Period';
}

  

  return (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-black via-[#0f172a] to-[#1e1b4b] px-6">

    <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-10">

      {/* LEFT - CAMERA */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl bg-white/5">
          
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />

          <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>

          {/* Overlay */}
          <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-3xl pointer-events-none"></div>
        </div>
      </div>

      {/* RIGHT - INFO PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center text-center">

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-10 w-full max-w-xl">

          <h1 className="text-4xl font-bold text-white mb-6">
            Face Recognition Attendance
          </h1>

          {/* Enrollment */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm">Enrollment No</p>
            <p className="text-2xl font-semibold text-emerald-400">
              {recognizedName}
            </p>
          </div>

          {/* Name */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm">Student Name</p>
            <p className="text-2xl font-semibold text-indigo-400">
              {recognizedStudentName}
            </p>
          </div>

          {/* Attendance Message */}
          {attendanceMessage && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
              {attendanceMessage}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 justify-center">

            <button
              onClick={handleRecognize}
              className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:scale-105 hover:shadow-indigo-500/40 transition-all duration-300"
            >
              Recognize Face
            </button>

            <Link to="/Signin">
              <button className="px-6 py-3 rounded-xl font-medium border border-white/20 text-white hover:bg-white/10 transition-all duration-300">
                Dashboard
              </button>
            </Link>

          </div>
        </div>

      </div>
    </div>
  </div>
);
}
export default Front;
 

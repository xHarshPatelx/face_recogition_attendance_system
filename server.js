const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require("dns");
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

dns.setServers(["1.1.1.1", "8.8.8.8"]);

mongoose.connect("mongodb+srv://face_recognition_db:XR3k3V9j4IC6KDk4@cluster0.ass9ffk.mongodb.net/?appName=Cluster0")
   .then(() => console.log("MongoDB Connected"))
   .catch(err => console.log("MongoDB connection error:", err));

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// --- Initialize Gemini ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Updated Chatbot Route with MongoDB Context ---
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    // 1. Fetch Real-Time Data from your Database
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Get all students
    const allStudents = await Student.find();
    
    // Get today's attendance logs
    const todaysLogs = await AttendanceLog.find({
      recognizedAt: { $gte: today }
    });

    // 2. Format the data into a readable summary for the AI
    const totalStudents = allStudents.length;
    const presentCount = todaysLogs.length;
    const absentCount = totalStudents - presentCount;

    // Create lists of names for the AI to reference
    const presentNames = todaysLogs.map(log => log.name).join(', ') || "None yet";
    
    // Find who is absent by comparing all students to today's logs
    const presentEnrollments = todaysLogs.map(log => log.enrollmentno);
    const absentStudentsList = allStudents
      .filter(student => !presentEnrollments.includes(student.enrollmentno))
      .map(student => student.name)
      .join(', ') || "None";

    // 3. Build the System Prompt
    const systemContext = `
      You are the AI assistant for a Face Recognition Attendance System.
      Use the following real-time database context to answer the user's questions accurately.
      If the user asks something unrelated to the system, politely guide them back.

      --- CURRENT SYSTEM STATE ---
      Date: ${new Date().toLocaleDateString()}
      Total Enrolled Students: ${totalStudents}
      Total Present Today: ${presentCount}
      Total Absent Today: ${absentCount}
      
      List of Present Students: ${presentNames}
      List of Absent Students: ${absentStudentsList}
      ----------------------------

      User Question: "${message}"
      
      Respond clearly, concisely, and naturally as an AI assistant.
    `;

    // 4. Send to Gemini
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemContext,
    });

    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: "Failed to generate AI response" });
  }
});

const studentSchema = new mongoose.Schema({
  name: String,
  enrollmentno:String,
  sem: String,
  branch: String,
  phone: String,
  enrolledAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);


app.post('/api/students', async (req, res) => {
  const { name, enrollmentno, sem, branch, phone } = req.body;

  if (!name ||!enrollmentno || !sem || !branch || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newStudent = new Student({ name, enrollmentno, sem, branch, phone });
    await newStudent.save();
    res.status(200).json({ message: "Student saved to database!" });
  } catch (err) {
    console.error("Error saving student:", err);
    res.status(500).json({ message: "Failed to save student" });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ enrolledAt: -1 });
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});


///////////////new log for attence storage////////

app.get('/api/attendance', async (req, res) => {
  try {
    const logs = await AttendanceLog.find().sort({ recognizedAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Failed to fetch attendance logs" });
  }
});


const attendanceLogSchema = new mongoose.Schema({
  enrollmentno: String,
  name: String,
  branch: String,
  recognizedAt: { type: Date, default: Date.now }
});

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);

app.post('/api/attendance', async (req, res) => {
  const { enrollmentno, name, branch, recognizedAt } = req.body;

  if (!enrollmentno) {
    return res.status(400).json({ message: "enrollmentno is required" });
  }

  try {
    let student = await Student.findOne({ enrollmentno });

    // If no student found, but name & branch provided => allow manual entry
    if (!student && (!name || !branch)) {
      return res.status(404).json({ message: "Student not found, and insufficient manual data provided" });
    }

    // Determine the current date (or use recognizedAt if provided)
    const today = new Date().toISOString().split('T')[0];
    const recognizedDate = recognizedAt ? new Date(recognizedAt) : new Date();

    // Check for existing attendance on the same day
    const existingLog = await AttendanceLog.findOne({
      enrollmentno,
      recognizedAt: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      }
    });

    if (existingLog) {
      return res.status(400).json({ message: "Attendance already recorded for today" });
    }

    // Use data from the DB or from manual fields
    const log = new AttendanceLog({
      enrollmentno,
      name: student ? student.name : name,
      branch: student ? student.branch : branch,
      recognizedAt: recognizedDate
    });

    await log.save();

    res.status(200).json({ message: "Attendance logged successfully" });
  } catch (err) {
    console.error("Error logging attendance:", err);
    res.status(500).json({ message: "Failed to log attendance" });
  }
});



///////////////////////admin login and signup///////////
const AdminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const Admin = mongoose.model("Admin", AdminSchema);


app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newAdmin = new Admin({
      username,
      email,
      password, // no hashing
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
/////////////////signin.///////
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.status(200).json({ message: "Signin successful", admin: { username: admin.username, email: admin.email } });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


const periodwiseAttendanceLogSchema = new mongoose.Schema({
  enrollmentno: String,
  name: String,
  branch: String,
  period: String,
  recognizedAt: { type: Date, default: Date.now }
});

const PeriodwiseAttendanceLog = mongoose.model('PeriodwiseAttendanceLog', periodwiseAttendanceLogSchema);

app.post('/api/periodwise-attendance', async (req, res) => {
  const { enrollmentno, recognizedAt } = req.body;

  console.log("Incoming data:", req.body); // 🔍 Debugging

  if (!enrollmentno) {
    return res.status(400).json({ message: "enrollmentno is required" });
  }

  try {
    const student = await Student.findOne({ enrollmentno });

    if (!student) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    const now = recognizedAt ? new Date(recognizedAt) : new Date();
    const period = getPeriodForCurrentTime(now);

    console.log("Calculated period:", period); // 🔍

    if (period === 'No Period') {
      return res.status(400).json({ message: "No valid class period at this time" });
    }

    const today = new Date(now.toISOString().split('T')[0]);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existingLog = await PeriodwiseAttendanceLog.findOne({
      enrollmentno,
      period,
      recognizedAt: { $gte: today, $lt: tomorrow }
    });

    if (existingLog) {
      return res.status(400).json({ message: `Attendance already recorded for ${period} today` });
    }

    const log = new PeriodwiseAttendanceLog({
      enrollmentno,
      name: student.name,
      branch: student.branch,
      period,
      recognizedAt: now
    });

    await log.save();
    console.log("Successfully saved period-wise attendance:", log); // 🔍

    res.status(200).json({ message: `Period-wise attendance recorded for ${period}`, log });

  } catch (err) {
    console.error("Error logging periodwise attendance:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




function getPeriodForCurrentTime(currentTime) {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();

  if (hours === 9 && minutes >= 30) return 'Java';
  if (hours === 10 && minutes >= 30) return 'Python';
  if (hours === 12 && minutes >= 30) return 'Networking';
  if (hours === 14 && minutes >= 30) return 'AI/ML';
  if (hours === 15 && minutes >= 30) return 'React'; 

  return 'No Period';
}

app.get('/api/periodwise-attendance', async(req,res)=>{
try{
  const logs=await PeriodwiseAttendanceLog.find().sort({recognizedAt:-1});
res.json(logs);
}catch{
  console.log("Error fetching periodwise logs:", err);
  res.status(500).json({ message: "Failed to fetch periodwise attendance logs" });
}
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

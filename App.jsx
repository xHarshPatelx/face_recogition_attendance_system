import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Front from './frontpage';
import Dashboard from './dashboard';
import Addstudent from './Addstudent';
import Enrolled from './Enrolled';
import Signin from './signin';
import Period from './period';
import Chatbot from './Chatbot';
import PredictionDashboard from './PredictionDashboard';
import Analysis from './Analysis';

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1b4b', // Dark purple to match your theme
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          }
        }}
      />
      
      <Router>
        <Routes>
          <Route path="/" element={<Front />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Addstudent" element={<Addstudent/>}/>
          <Route path="/Enrolled" element={<Enrolled/>}/>
          <Route path="/Signin" element={<Signin/>}/>
          <Route path="/Period" element={<Period/>}/>
          <Route path="/Predictions" element={<PredictionDashboard />} />
          <Route path="/Analysis" element={<Analysis />} />
        </Routes>

        <Chatbot /> 
      </Router>
    </>
  );
}

export default App;
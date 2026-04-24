import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

import "../styles/home.css"

export default function Home() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    students: 0,
    votes: 0,
    roles: 0
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState([]);
  const [announcement, setAnnouncement] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isActive, setIsActive] = useState(false);


const loadElectionStatus = async () => {
  try {
    const res = await API.get("election/status/");

    setIsActive(res.data.is_active);
    setTimeLeft(res.data.time_left);

  } catch (err) {
    console.log(err);
  }
};

  const loadResults = async () => {
  const res = await API.get("admin/results/");
   setResults(res.data);
  };

  const loadAnnouncement = async () => {
  const res = await API.get("public/announcement/");
  setTimeLeft(res.data.seconds);
};

useEffect(() => {
  loadAnnouncement();
  loadStats();
  loadResults();
  loadElectionStatus();
}, []);

useEffect(() => {
  const timer = setInterval(() => {
    setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
  }, 1000);

  return () => clearInterval(timer);
}, []);

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h}h ${m}m ${s}s`;
};


  const loadStats = async () => {
  try {
    const res = await API.get("public/stats/");
    setStats({
      students: res.data.students,
      votes: res.data.votes,
      roles: res.data.roles
    });
  } catch (err) {
    console.log(err);
  }
};

 

  return (
    <div className="home" style={{ minHeight: "100vh" }}>

      {/* 🔝 NAVBAR */}
      <div className="navbar">
        <div className="logo">
          🎓 <span>VoteCampus</span>
        </div>
      </div>

      {/* 🎯 HERO */}
      <div className="hero">

        <h1>DEPARTMENT ELECTIONS</h1>

        <h2 className="college">ABC College</h2>
        <p className="dept">Computer Science Department</p>

        <p className="desc">
          Secure • Real-Time • Transparent Voting System
        </p>

        <div className="hero-buttons">
          <button onClick={() => navigate("/register")}>
            Register to Vote
          </button>

          <button onClick={() => navigate("/login")} className="outline">
            Student Login
          </button>
        </div>

        {/* 📊 LIVE COUNTS */}
        <div className="stats">
          <div>
            <h2>{stats.students}</h2>
            <p>Registered Students</p>
          </div>

          <div>
            <h2>{stats.votes}</h2>
            <p>Votes Cast</p>
          </div>

          <div>
            <h2>{stats.roles}</h2>
            <p>Election Roles</p>
          </div>
        </div>
      </div>

      <div className="announcement">
  📢 Election ends in: {formatTime(timeLeft)}
  </div>
              


         

      {/* 🏆 LIVE RESULTS PREVIEW */}
     <div className="section">
        <h2>Live Results Preview</h2>

        <div className="result-grid_1">   {/* ✅ ADD THIS */}
          {results.map((r, i) => (
            <div key={i} className="result-card_1">
              <h3>{r.role}</h3>
               <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Votes</th>
                  </tr>
                </thead>

                <tbody>
                  {r.candidates.map(c => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.votes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
               🏆 Winner :  {r.winner || "No votes"} ({r.max_votes} votes)
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 🎯 FEATURES */}
      <div className="section features">
        <h2>Features</h2>

        <div className="feature-grid">

          <div className="feature-card">
            <h3>🔒 Secure Voting</h3>
            <p>JWT-based authentication ensures safe and tamper-proof voting.</p>
          </div>

          <div className="feature-card">
            <h3>⚡ Real-time Results</h3>
            <p>Live vote updates using WebSocket without refreshing.</p>
          </div>

          <div className="feature-card">
            <h3>📊 Live Charts</h3>
            <p>Visual representation of votes using interactive charts.</p>
          </div>

          <div className="feature-card">
            <h3>🧑‍🎓 Student Authentication</h3>
            <p>Only registered students can vote securely.</p>
          </div>

        </div>
      </div>

        {/* 📞 FOOTER */}
        <div className="footer">
          
          <p>© 2026 VoteCampus</p>

          <button onClick={() => setShowModal(true)}>
            Contact Info
          </button>
        </div>

        {/* 💬 MODAL */}
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Contact</h2>
              <p>Name: Kingsly J</p>
              <p>Email: kingsly@email.com</p>

              <button onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}

    </div>
   
   
  );
}
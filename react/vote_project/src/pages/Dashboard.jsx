import React, { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [profile, setProfile] = useState({});
  const [data, setData] = useState([]);
  const [votedRoles, setVotedRoles] = useState([]);
  const [liveMessage, setLiveMessage] = useState(""); // ✅ NEW
  const [timeLeft, setTimeLeft] = useState(0);
  const [votedCandidates, setVotedCandidates] = useState({});
  const [dashboard, setDashboard] = useState({

  votes_cast: 0,
  total_roles: 0,
  is_active: true,
  time_left: 0,
  total_votes: 0
});


const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h}h ${m}m ${s}s`;
};



 const loadDashboard = async () => {
  const res = await API.get("student/dashboard/");
  setDashboard(res.data);
  setTimeLeft(res.data.time_left);

  setVotedRoles(res.data.voted_roles);            
  setVotedCandidates(res.data.voted_candidates);  
};


  // ✅ Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  if (!timeLeft) return;

  const interval = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);

}, [timeLeft]);

  useEffect(() => {
  loadDashboard();

  const socket = new WebSocket("ws://127.0.0.1:8000/ws/votes/");

  socket.onopen = () => {
    console.log("WebSocket Connected ✅");
  };

  socket.onmessage = (event) => {
    const res = JSON.parse(event.data);

    // ✅ Live banner message
    setLiveMessage(res.message);

    // ✅ Refresh everything
    fetchData();       // candidates + profile
    loadDashboard();   // votes_cast + total_votes + timer
  };

  socket.onerror = (err) => {
    console.log("WebSocket Error ❌", err);
  };

  socket.onclose = () => {
    console.log("WebSocket Closed");
  };

  return () => socket.close();
}, []);


  // ✅ Fetch profile + candidates
  const fetchData = async () => {
    try {
      const prof = await API.get("profile/");
      const res = await API.get("candidates/");

      setProfile(prof.data);
      setData(res.data);
    } catch (err) {
      console.log("Error fetching data", err);
    }
  };

  // ✅ Handle Vote
  const handleVote = async (role_id, candidate_id) => {
    try {
      await API.post("vote/", { role_id, candidate_id });

      // alert("Vote Submitted ✅");

      setVotedRoles([...votedRoles, role_id]);
      fetchData(); // refresh votes
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
  };

  return (
    <div className="dashboard">

      {/* 🔷 NAVBAR */}
      <div className="navbar">
        <div className="logo">🎓 VoteCampus</div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>

      {/* 🔴 LIVE MESSAGE */}
      {liveMessage && (
        <div className="live-banner">
          🔴 LIVE: {liveMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="header">
        <h2>Welcome, {profile.name}</h2>
        <p>{profile.student_id} • {profile.department}</p>
      </div>

      <div className="top-cards">

        {/* Votes */}
        <div className="card">
          <h3>Your Votes Cast</h3>
          <h1>{dashboard.votes_cast}</h1>
          <p>of {dashboard.total_roles} roles</p>
        </div>

        {/* Status */}
      <div className="card">

          <h3>Election Status</h3>

          <h1 style={{ color: dashboard.is_active ? "yellow" : "red" }}>
            {dashboard.is_active ? "ACTIVE" : "STOPPED"}
          </h1>

          {!dashboard.is_active || timeLeft === 0 ? (
            <p style={{color: "red"}}>Election Closed</p>
          ) : (
            <>
              <p>Ends in {formatTime(timeLeft)}</p>

              {timeLeft <= 60 && (
                <p style={{ color: "orange" }}>
                  ⚠ Ending soon!
                </p>
              )}
            </>
          )}

        </div>
        {/* Total Votes */}
        <div className="card">
          <h3>Total Votes Live</h3>
          <h1>{dashboard.total_votes}</h1>
          <p style={{ color: dashboard.is_active ? "#22c55e" : "red" }}>
            {dashboard.is_active ? "Just now" : "Live Over"}
          </p>
        </div>

      </div>

      {/* ROLES */}
      {data.map((role) => (
        <div className="role-section" key={role.role_id}>

          <div className="role-header">
            <h3>
              
                {role.role.toLowerCase() === "president" && "👑 "}
                {role.role.toLowerCase() === "vp" && "⭐ "}
                {role.role.toLowerCase() === "sports" && "📝 "}
                {role.role.toLowerCase() === "cultural" && "💰 "}
                {role.role}

            </h3>
              <span
                  className={`vote-now ${
                    dashboard.is_active ? "active-vote" : "inactive-vote"
                  }`}
                  >
                  {votedRoles.includes(role.role_id)
                    ? "Voted ✅"
                    : dashboard.is_active
                    ? "Vote Now"
                    : "Vote"}
              </span>
          </div>

          <div className="candidates">
              {role.candidates.map((c) => (
                <div className="card" key={c.id}>

                  <div className="avatar">
                      {c.name.charAt(0)}
                    </div>

                    <h4>{c.name}</h4>
                    <p>{c.department}</p>
                    <p>{c.votes} votes</p>

                  <button
                        disabled={
                          votedCandidates[role.role_id] ||   // ✅ already voted for this role
                          !dashboard.is_active ||
                          timeLeft === 0
                        }
                        onClick={() => handleVote(role.role_id, c.id)}
                      >
                        {votedCandidates[role.role_id] === c.id
                          ? "Voted ✅"                        // ✅ ONLY selected candidate
                          : !dashboard.is_active || timeLeft === 0
                          ? "Closed ❌"
                          : "Vote"}
                  </button>
                </div>
              ))}
          </div>

        </div>
      ))}
    </div>
  );
}
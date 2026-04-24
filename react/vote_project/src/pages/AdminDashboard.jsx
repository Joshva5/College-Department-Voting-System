import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Pie, Bar } from "react-chartjs-2";
import "../styles/admin.css";

export default function AdminDashboard() {

  const [stats, setStats] = useState({});
  const [chart, setChart] = useState({ pie: [], bar: [] });
  const [active, setActive] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [activeTab, setActiveTab] = useState("LIVE");

  const [newCandidate, setNewCandidate] = useState({
    student_id: "",
    name: "",
    department: "",
    role: "PRESIDENT"
  });


  const setTimer = async () => {
  await API.post("admin/set-time/", { minutes });

  setShowTimerModal(false);   // close popup
  setMinutes("");             // clear input

  
};

  useEffect(() => {
    loadData();

    // 🔴 WebSocket (LIVE)
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/votes/");

    ws.onopen = () => {
      console.log("WebSocket Connected ✅");
    };

    ws.onmessage = () => {
      loadData(); // refresh charts live
    };

    ws.onerror = (err) => {
      console.log("WebSocket Error ❌", err);
    };

    ws.onclose = () => {
      console.log("WebSocket Closed");
    };

    // ✅ IMPORTANT CLEANUP
    return () => ws.close();

  }, []);

  const loadData = async () => {
  try {
    const s = await API.get("admin/stats/");
    const c = await API.get("admin/chart/");
    const candid = await API.get("admin/candidates/");
    const stu = await API.get("admin/students/");
    const res = await API.get("admin/results/");
    


    setResults(res.data);
    setStats(s.data);
    setChart(c.data);
    setCandidates(candid.data);
    setStudents(stu.data);
   

  } catch (err) {
    console.log("Error loading data", err);
  }
};


useEffect(() => {
 loadData();
}, []);

const fetchCandidates = async () => {
  try {
    const candid = await API.get("admin/candidates/");
    setCandidates(candid.data);   // store data
  } catch (err) {
    console.log(err);
  }
};


  const handleElection = async (type) => {
  try {
    await API.post("election/toggle/", {
      action: type
    });

    

    setActive(type === "start");
    await loadData();  // refresh stats

  } catch (err) {
    console.log(err);
  }
};

  // ➕ Add Candidate
const addCandidate = async () => {
  try {
    await API.post("admin/add_candidate/", {
      student_id: newCandidate.student_id,
      role: newCandidate.role
    });

    setNewCandidate({
      student_id: "",
      name: "",
      department: "",
      role: "PRESIDENT"
    });

    await fetchCandidates();

  } catch (err) {
    console.log(err.response?.data);
    alert(err.response?.data?.error || "Error");
  }
};
// ❌ Delete Candidate
const deleteCandidate = async (id) => {
  await API.delete(`admin/candidates/${id}/`);
  loadData();
};

  // 🎯 PIE DATA
 const filteredCandidates =
  selectedRole === "ALL"
    ? chart.pie
    : chart.pie.filter(
        c => c.role?.toUpperCase() === selectedRole
      );

const colors = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#3b82f6", "#a855f7", "#14b8a6", "#f43f5e"
];

const pieData = {
  labels: filteredCandidates.map(p => p.name),
  datasets: [
    {
      label: "Votes",
      data: filteredCandidates.map(p => p.votes),

      // ✅ ADD THIS
      backgroundColor: filteredCandidates.map(
        (_, i) => colors[i % colors.length]
      ),

      borderColor: "#0f172a",
      borderWidth: 2,
      hoverOffset: 15
    }
  ]
};
const barData = {
  labels: chart.bar.map(b => b.role),
  datasets: [
    {
      label: "Votes",
      data: chart.bar.map(b => b.votes),

      // 🎨 ADD COLORS HERE
      backgroundColor: [
        "#6366f1", // President
        "#22c55e", // VP
        "#f59e0b", // Sports
        "#ef4444"  // Cultural
      ],

      borderColor: "#0f172a",
      borderWidth: 1
    }
  ]
};
 
const handleEditChange = (e) => {
  setEditCandidate({
    ...editCandidate,
    [e.target.name]: e.target.value
  });
};

const openEditModal = (c) => {
  setEditCandidate(c);
  setShowModal(true);
};


const updateCandidate = async () => {
  await API.put(`admin/candidates/${editCandidate.id}/`, editCandidate);

  setShowModal(false);
  setEditCandidate(null);

  loadData();
};

  const barOptions = {
  scales: {
    y: {
      grid: {
        color: "#374151" // brighter grid line
      }
    },
    x: {
      grid: {
        color: "#374151"
      }
    }
  }
};
const resetElection = async () => {
  if (!window.confirm("⚠️ Are you sure to reset election?")) return;

  try {
    await API.post("admin/reset-election/");
    alert("✅ Election Reset Done");

    loadData(); // refresh UI
  } catch (err) {
    console.log(err);
  }
};

 
  return (
    <div className="admin">

            {/* 🔷 NAVBAR */}
            <div className="navbar">
              <div className="logo">🎓 VoteCampus</div>

              <div className="navbar-right">
                 <button onClick={resetElection} className="logout-btn">
                  Reset Election
                </button>
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
            </div>




      {/* HEADER */}
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Election Control Center</p>
      </div>

      {/* STATUS */}
      
      <div className="status-bar">

        <div className="status-left">
          {active ? "🟢 ACTIVE" : "🔴 STOPPED"}
        </div>

        <div className="status-center">
          <button onClick={() => handleElection(active ? "stop" : "start")}>
            {active ? "Stop Election" : "Start Election"}
          </button>
        </div>

        <div className="status-right">
          <button onClick={() => setShowTimerModal(true)}>
            Set Time
          </button>
        </div>
      </div>
      {/* STATS */}

    <div className="laystats">
      <div className="stats">
        <div>
          <h2>{stats.students || 0}</h2>
          <p>Total Students</p>
        </div>

        <div>
          <h2>{stats.votes || 0}</h2>
          <p>Total Votes</p>
        </div>

        <div>
          <h2>{stats.roles?.length || 0}</h2>
          <p>Roles</p>
        </div>
      </div>
    </div> 

      <div className="tabs">
        <button onClick={() => setActiveTab("LIVE")}>Live Result</button>
        <button onClick={() => setActiveTab("CANDIDATES")}>Candidates</button>
        <button onClick={() => setActiveTab("STUDENTS")}>Students</button>
      </div>



      {activeTab === "LIVE" && (
     <>
      <div className="charts">

        <div className="chart-card">
          <h3>Vote Distribution</h3>
          <div className="role-filter">
          <button onClick={() => setSelectedRole("ALL")}>All</button>
          <button onClick={() => setSelectedRole("PRESIDENT")}>President</button>
          <button onClick={() => setSelectedRole("VP")}>VP</button>
          <button onClick={() => setSelectedRole("SPORTS")}>Sports</button>
          <button onClick={() => setSelectedRole("CULTURAL")}>Cultural</button>
        </div>
          <Pie
            key={JSON.stringify(pieData)}   // ✅ FIX FOR ERROR
            data={pieData}
            redraw={true}
            options={{ maintainAspectRatio: false }}
          />
        </div>

        <div className="chart-card">
          <h3>Votes by Role</h3>
          <Bar
            key={JSON.stringify(barData)}   // ✅ FIX FOR ERROR
            data={barData}
            redraw={true}
            options={barOptions} 
          />
        </div>
      </div>


      {/* 🏆 RESULTS */}
      <div className="section">
        <h2>Final Results</h2>

        <div className="final-result-wrapper">
            {results.map((r, index) => (
            <div key={index} className="result-card">

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

              <h4 className="winner">🏆 Winner: {r.winner || "No votes yet"}</h4>

            </div>
        
          ))}
        </div>
      </div>
  
     </>
)}




   


      {/* 👥 CANDIDATES MANAGEMENT */}
      {activeTab === "CANDIDATES" && (
          <div className="section">
        <h2>Manage Candidates</h2>

        {/* ADD FORM */}
        <div className="add-form">

            <input
              placeholder="Student ID"
              value={newCandidate.student_id}
              onChange={(e) =>
                setNewCandidate({ ...newCandidate, student_id: e.target.value })
              }
            />


          <input placeholder="Name"
          value={newCandidate.name}
          onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})} />

          <select
                value={newCandidate.department}
                onChange={(e) =>
                  setNewCandidate({ ...newCandidate, department: e.target.value })
                }
              >
                <option value="">Select Department</option>
                <option value="CSE">Computer Science</option>
          </select>

          <select
            value={newCandidate.role}
            onChange={(e) => setNewCandidate({...newCandidate, role: e.target.value})}>
            <option value="PRESIDENT">President</option>
            <option value="VP">Vice-President</option>
            <option value="SPORTS">Sports Captain</option>
            <option value="CULTURAL">Cultural Captain</option>
          </select>

          <button onClick={addCandidate} disabled={
              !newCandidate.student_id ||
            !newCandidate.name ||
            !newCandidate.department ||
            !newCandidate.role
            }>Add Candidate</button>
        </div>

        <div className="table-wrapper">{/* TABLE */}
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Role</th>
              <th>Votes</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {candidates.map(c => (
              <tr key={c.id}>
               <td>{c.student_id || "-"}</td>
                <td>{c.name}</td>
                <td>{c.department}</td>
                <td>{c.role}</td>
                <td>{c.votes}</td>
                <td> <span className={`status ${c.is_active ? "active" : "inactive"}`}>
                     {c.is_active ? "Active" : "Inactive"}
                </span></td>
                <td>
                  <button className="action-btn edit-btn" onClick={() => openEditModal(c)}>Edit</button>
                  <button className="action-btn delete-btn" onClick={() => deleteCandidate(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      )}


      {/* 🎓 STUDENTS */}
      {activeTab === "STUDENTS" && (
        <div className="section">
        <h2>Students</h2>

        <input
          placeholder="Search Student ID"
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Votes</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {students
              .filter(s => s.student_id.includes(search))
              .map(s => (
                <tr key={s.student_id}>
                  <td>{s.student_id}</td>
                  <td>{s.name}</td>
                  <td>{s.department}</td>
                  <td>{s.votes_cast}/{s.total_roles}</td>
                  <td>
                    <span
                        className={`status-badge ${
                          s.status === "Completed"
                            ? "green"
                            : s.status === "Partial"
                            ? "orange"
                            : "red"
                        }`}
                      >
                        {s.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>
  
)}



      

      

      {showModal && (
        <div className="modal">
          <div className="modal-content">

           <h2 style={{ textAlign: "center" }}>Edit Candidate</h2>


            <input
                name="student_id"
                value={editCandidate.student_id}
                onChange={handleEditChange}
            />

            <input
              name="name"
              value={editCandidate.name}
              onChange={handleEditChange}
            />

            <select
                name="department"
                value={editCandidate.department}
                onChange={handleEditChange}
            >
              <option value="CSE">CSE</option>
            </select>

            <select
              name="role"
              value={editCandidate.role}
              onChange={handleEditChange}
            >
              <option value="PRESIDENT">President</option>
              <option value="VP">Vice-President</option>
              <option value="SPORTS">Sports Captain</option>
              <option value="CULTURAL">Cultural Captain</option>
            </select>

            <div className="modal-buttons">
              <button onClick={updateCandidate}>Update</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>

            

          </div>
        </div>
      )}


      {showTimerModal && (
        <div className="modal">
          <div className="modal-content">

            <h2>Set Election Timer</h2>

            <input
              type="number"
              placeholder="Enter minutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />

            <div className="modal-buttons">
              <button onClick={setTimer}>Set</button>
              <button onClick={() => setShowTimerModal(false)}>Cancel</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
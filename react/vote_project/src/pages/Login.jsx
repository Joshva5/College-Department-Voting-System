import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"


export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    student_id: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 const handleLogin = async () => {
  try {
    const res = await API.post("login/", form);

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.role);

    // 🔥 ROLE BASED REDIRECT
    if (res.data.role === "ADMIN") {
      navigate("/admin");
    } 
   else {
      navigate("/dashboard");
    }

  } catch {
    setError("Invalid credentials");
  }
};

  return (
    <div className="page1">
      <div className="navbar1">
        <div className="logo1">🎓 VoteCampus</div>

        <button
          className="home-btn1"
          onClick={() => navigate("/")}
        >
          Home
        </button>
      </div>
      <div className="login-container">
        <div className="login-card">

          <h2>Login</h2>

          {error && <p className="error1">{error}</p>}

          <input
            name="student_id"
            placeholder="Student ID"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />

          <button className="primary-btn1" onClick={handleLogin}>
            Login
          </button>

          <p className="link1">
              No account? 
              <span onClick={() => navigate("/register")}> Register now</span>
          </p>

        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import axios from "axios";
import "../styles/register.css"
import { useNavigate } from "react-router-dom";


export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    student_id: "",
    department: "",
    year: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ VALIDATION
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
    }
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const idPattern =/^26ECS[0-9]{4}$/;
    if (!form.student_id) {
      newErrors.student_id = "Student ID is required";
    } else if (!idPattern.test(form.student_id)) {
      newErrors.student_id = "Format must be like 26ECS0001";
    }

    if (!form.department) {
      newErrors.department = "Department is required";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } 
    else if (!passwordPattern.test(form.password)) {
      newErrors.password =
        "Password must be 8+ chars, include uppercase, lowercase, number & special character";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  // ✅ API CALL
  const handleSubmit = async () => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/register/",
        {
          name: form.name,
          student_id: form.student_id,
          department: form.department,
          year: form.year,
          email: form.email,
          password: form.password,
        }
      );

      console.log(res.data);

      alert("Registered Successfully ✅");

      navigate("/login");

      // 🔥 RESET FORM
      setForm({
        name: "",
        student_id: "",
        department: "",
        year: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setErrors({});

    } catch (err) {
  console.log("ERROR:", err.response?.data);

  setErrors({
    api: err.response?.data?.error || "Registration failed"
  });
}
    
  };

  return (


    
  <div className="page">
      <div className="navbar">
        <div className="logo">🎓 VoteCampus</div>
      </div>
      <div className="page-center">
        <div className="register-card">

          <h2>Create Account</h2>
          <p>Register with your official Student ID</p>

          {/* 🔴 API ERROR */}
          {errors.api && <p className="error">{errors.api}</p>}

          {/* NAME + STUDENT ID */}
          <div className="row">
            <div className="field">
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="field">
              <input
                name="student_id"
                placeholder="Student ID"
                value={form.student_id}
                onChange={handleChange}
              />
              {errors.student_id && <span className="error">{errors.student_id}</span>}
            </div>
          </div>

          {/* DEPARTMENT + YEAR */}
          <div className="row">
            <div className="field">
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="CSE">Computer Science</option>
              </select>
              {errors.department && <span className="error">{errors.department}</span>}
            </div>

            <div className="field">
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
              </select>
            </div>
          </div>

          {/* EMAIL */}
          
            <div className="field1">
              <input
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
          

          {/* PASSWORD */}
          <div className="row">
            <div className="field">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div className="field">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Repeat Password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button className="primary-btn" onClick={handleSubmit}>
            Create Account
          </button>

          <p className="link">
            Already registered? 
            <span onClick={() => navigate("/login")}> Login here</span>
          </p>

        </div>
      </div>
    </div>
  );
}
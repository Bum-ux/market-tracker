import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/auth_context";
import { useNavigate } from "react-router-dom";
import type { SubmitEvent } from "react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      setToken(response.data.access_token);
      localStorage.setItem("accessToken", response.data.access_token);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-sm-10 col-md-6 col-lg-4">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <h1 className="fw-bold">Welcome back</h1>

                <p className="text-muted">Sign in to your Bum News account</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    className="form-control"
                    placeholder="Enter your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    required
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}

                <button
                  type="submit"
                  className="btn btn-dark w-100"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  Don't have an account?{" "}
                  <a href="" className="text-decoration-none">
                    {" "}
                    Sign Up
                  </a>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

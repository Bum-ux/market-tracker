import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth_context";
import api from "../services/api";

interface NavBarProps {
  brandName: string;
  imageSrcPath: string;
}

function NavBar({ brandName, imageSrcPath }: NavBarProps) {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      setToken(null);

      navigate("/login");
    } catch (error) {
      console.error("Can not logout:", error);
    }
  };

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-white shadow">
      <div className="container-fluid">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <img
            src={imageSrcPath}
            width="60"
            height="60"
            className="d-inline-block align-middle"
            alt=""
          />

          <span className="fw-bold fs-4 ms-2">{brandName}</span>
        </Link>

        {/* Mobile button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation */}
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to={""} className="nav-link active" aria-current="page">
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link to={"/news"} className="nav-link">
                News
              </Link>
            </li>

            <li className="nav-item">
              <Link to={"/markets"} className="nav-link">
                Market
              </Link>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Dropdown link
              </a>

              <ul className="dropdown-menu">
                <li>
                  <a className="dropdown-item" href="#">
                    Action
                  </a>
                </li>

                <li>
                  <a className="dropdown-item" href="#">
                    Another action
                  </a>
                </li>

                <li>
                  <a className="dropdown-item" href="#">
                    Something else here
                  </a>
                </li>
              </ul>
            </li>

            {/* Auth */}
            <li className="nav-item">
              {token ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-link nav-link border-0"
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;

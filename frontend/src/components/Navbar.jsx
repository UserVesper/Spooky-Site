import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink 
        to="/" 
        end
        className={({ isActive }) => (isActive ? "active-link" : "")}
      >
        INÍCIO
      </NavLink>
      <NavLink 
        to="/mapa" 
        className={({ isActive }) => (isActive ? "active-link" : "")}
      >
        MAPA
      </NavLink>
      <NavLink 
        to="/graficos"
        className={({ isActive }) => (isActive ? "active-link" : "")}
      >
        GRÁFICO
      </NavLink>
      <NavLink 
        to="/poi"
        className={({ isActive }) => (isActive ? "active-link" : "")}
      >
        POI
      </NavLink>
    </nav>
  );
}
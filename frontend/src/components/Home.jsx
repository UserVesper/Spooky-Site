import { Link } from "react-router-dom";
import Zombie from "./Zombie.jsx";
import MummyUp from "./Mummy_up.jsx";
import MummyDown from "./Mummy_down.jsx";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <MummyUp />
      
      <div className="monster-wrapper">
        <Zombie />
      </div>

      <div className="home-cta-wrapper">
        <Link to="/mapa" className="btn-explore-map">
          EXPLORAR MAPA ➔
        </Link>
      </div>

      <MummyDown />
    </div>
  );
}

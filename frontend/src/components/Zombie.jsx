import { ReactComponent as ZombieSVG } from "../assets/zombie.svg";
import "./Zombie.css";

export default function Zombie() {
  return (
    <section className="zombie">
      <ZombieSVG className="zombie-image" />
    </section>
  );
}
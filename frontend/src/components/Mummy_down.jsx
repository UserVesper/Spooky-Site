import { ReactComponent as MummyDownSVG } from "../assets/mummy_down.svg";
import "./Mummy_down.css";

export default function mummy_down() {
  return (
    <section className="mummy_down">
      <MummyDownSVG className="mummy_down-image" />
    </section>
  );
}
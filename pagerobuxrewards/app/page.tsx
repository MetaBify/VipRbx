import Middle from "./components/Middle";
import RobuxBox from "./components/RobuxBox";

export default async function Home() {
  return (
    <div className="home-container ">
      <Middle />
      <RobuxBox />
    </div>
  );
}

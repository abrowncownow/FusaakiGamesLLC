import { CharterApp } from "./CharterApp";
import { LabApp } from "./LabApp";
import { JourneyApp } from "./JourneyApp";

export function App() {
  const view = new URLSearchParams(location.search).get("view");
  return view === "lab" ? (
    <LabApp />
  ) : view === "charter" ? (
    <CharterApp />
  ) : (
    <JourneyApp />
  );
}

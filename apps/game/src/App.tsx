import { CharterApp } from "./CharterApp";
import { LabApp } from "./LabApp";

export function App() {
  const laboratory = new URLSearchParams(location.search).get("view") === "lab";
  return laboratory ? <LabApp /> : <CharterApp />;
}

import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "L")!;
export default function ProblemL() { return <ProblemInteraction p={problem}/>; }

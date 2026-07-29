import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "G")!;
export default function ProblemG() { return <ProblemInteraction p={problem}/>; }

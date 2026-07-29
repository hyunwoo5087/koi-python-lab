import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "D")!;
export default function ProblemD() { return <ProblemInteraction p={problem}/>; }

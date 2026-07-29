import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "B")!;
export default function ProblemB() { return <ProblemInteraction p={problem}/>; }

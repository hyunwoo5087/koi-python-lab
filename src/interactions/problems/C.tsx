import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "C")!;
export default function ProblemC() { return <ProblemInteraction p={problem}/>; }

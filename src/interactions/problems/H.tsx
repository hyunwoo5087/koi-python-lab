import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "H")!;
export default function ProblemH() { return <ProblemInteraction p={problem}/>; }

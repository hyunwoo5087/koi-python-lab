import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "I")!;
export default function ProblemI() { return <ProblemInteraction p={problem}/>; }

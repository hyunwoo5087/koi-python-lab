import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "F")!;
export default function ProblemF() { return <ProblemInteraction p={problem}/>; }

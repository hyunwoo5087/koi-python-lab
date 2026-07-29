import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "K")!;
export default function ProblemK() { return <ProblemInteraction p={problem}/>; }

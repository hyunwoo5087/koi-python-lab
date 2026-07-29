import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "J")!;
export default function ProblemJ() { return <ProblemInteraction p={problem}/>; }

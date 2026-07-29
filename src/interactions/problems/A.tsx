import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "A")!;
export default function ProblemA() { return <ProblemInteraction p={problem}/>; }

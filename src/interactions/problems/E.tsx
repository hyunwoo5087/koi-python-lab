import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "E")!;
export default function ProblemE() { return <ProblemInteraction p={problem}/>; }

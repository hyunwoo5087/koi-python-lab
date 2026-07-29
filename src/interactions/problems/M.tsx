import ProblemInteraction from "../ProblemInteraction";
import { problems } from "../../data/problems";

const problem = problems.find((item) => item.id === "M")!;
export default function ProblemM() { return <ProblemInteraction p={problem}/>; }

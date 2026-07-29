import type { ComponentType } from "react";
import type { Problem } from "../data/problems";
import ProblemA from "./problems/A";
import ProblemB from "./problems/B";
import ProblemC from "./problems/C";
import ProblemD from "./problems/D";
import ProblemE from "./problems/E";
import ProblemF from "./problems/F";
import ProblemG from "./problems/G";
import ProblemH from "./problems/H";
import ProblemI from "./problems/I";
import ProblemJ from "./problems/J";
import ProblemK from "./problems/K";
import ProblemL from "./problems/L";
import ProblemM from "./problems/M";
import ProblemN from "./problems/N";
import ProblemO from "./problems/O";

const interactionById: Record<string, ComponentType> = {
  A: ProblemA,
  B: ProblemB,
  C: ProblemC,
  D: ProblemD,
  E: ProblemE,
  F: ProblemF,
  G: ProblemG,
  H: ProblemH,
  I: ProblemI,
  J: ProblemJ,
  K: ProblemK,
  L: ProblemL,
  M: ProblemM,
  N: ProblemN,
  O: ProblemO,
};

export default function ProblemStage({ problem }: { problem: Problem }) {
  const Interaction = interactionById[problem.id];
  return Interaction ? <Interaction/> : null;
}

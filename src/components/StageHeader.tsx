type StageHeaderProps = {
  stages: string[];
  stage: number;
  onMove: (stage: number) => void;
};

export default function StageHeader({ stages, stage, onMove }: StageHeaderProps) {
  return (
    <nav className="stage-header" aria-label="문제 해결 단계">
      {stages.map((label, index) => (
        <button
          type="button"
          key={label}
          onClick={() => index <= stage && onMove(index)}
          disabled={index > stage}
          className={index === stage ? "current" : index < stage ? "complete" : ""}
        >
          <small>STEP {index + 1}</small>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

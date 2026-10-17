"use client";

type StudioCardProps = {
  leaving: boolean;
  onSkip: () => void;
};

export function StudioCard({ leaving, onSkip }: StudioCardProps) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className={`studio-card ${leaving ? "is-leaving" : ""}`}
      aria-label="GrygielGames przedstawia. Stuknij, by pominąć."
    >
      <span className="studio-bloom" aria-hidden="true" />
      <svg className="studio-ring" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="70" />
        <circle className="studio-spark" cx="80" cy="10" r="3.4" />
      </svg>
      <span className="studio-name">GrygielGames</span>
      <span className="studio-rule" aria-hidden="true" />
      <span className="studio-line">przedstawia</span>
      <span className="studio-skip">Stuknij, by pominąć</span>
    </button>
  );
}

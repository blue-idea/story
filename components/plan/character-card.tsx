import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CharacterCardProps = {
  name: string;
  role: string;
  summary: string;
};

export function CharacterCard({ name, role, summary }: CharacterCardProps) {
  return (
    <article className="plan-character-card">
      <div className="plan-character-meta">
        <span className="plan-chip">{role}</span>
        <h3>{name}</h3>
      </div>
      <div className="plan-character-summary-container">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
      </div>
    </article>
  );
}

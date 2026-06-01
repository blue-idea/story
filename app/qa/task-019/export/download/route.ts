const CONTENT = `# QA Export Novel

## Outline

Signal archive recovered and stabilized.

## Character Profiles

- Lin Xia: investigative reporter
- Zhou Lan: broadcast engineer

## Chapters

### Chapter 1 - Rain Signal

Recovered first evidence.
`;

export async function GET() {
  return new Response(CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=\"qa-task-019.md\"; filename*=UTF-8''qa-task-019.md",
    },
  });
}

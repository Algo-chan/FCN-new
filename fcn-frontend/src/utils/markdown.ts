export function cleanAssessmentMessage(content: string): string {
  if (!content) return "";
  if (!content.includes("FINAL_ASSESSMENT") && !content.includes('"risk_level"')) {
    return content;
  }
  let cleaned = content.replace(/FINAL_ASSESSMENT/gi, "");
  cleaned = cleaned.replace(/```(?:json)?[\s\S]*?```/gi, "");
  cleaned = cleaned.replace(/\{[\s\S]*?"risk_level"[\s\S]*?\}/gi, "");
  cleaned = cleaned.trim();
  return cleaned || "I have completed your clinical assessment. Please review the detailed assessment below.";
}

export function parseMarkdown(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  }
  html = "<p>" + html + "</p>";
  return html;
}

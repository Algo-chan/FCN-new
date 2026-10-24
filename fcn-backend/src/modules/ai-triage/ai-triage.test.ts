import { describe, it, expect } from "vitest";
import { aiTriageService, extractConversationalMessage } from "./ai-triage.service";

describe("AI Triage Service Unit Tests", () => {
  it("extracts conversational message by stripping FINAL_ASSESSMENT and JSON blocks", () => {
    const raw = `Based on your symptoms, I have completed the review.
FINAL_ASSESSMENT
\`\`\`json
{
  "risk_level": "LOW",
  "risk_explanation": "Mild upper respiratory tract irritation",
  "likely_causes": ["Common Cold"],
  "recommended_specialty": "General Practitioner",
  "recommended_actions": ["Rest", "Hydration"],
  "warning_signs": ["Difficulty breathing"],
  "home_care_tips": ["Drink warm liquids"],
  "disclaimer": "Advisory only"
}
\`\`\``;

    const extracted = extractConversationalMessage(raw);
    expect(extracted).toContain("Based on your symptoms");
    expect(extracted).not.toContain("FINAL_ASSESSMENT");
    expect(extracted).not.toContain("```json");
  });

  it("parses final assessment JSON correctly", () => {
    const raw = `\`\`\`json
{
  "risk_level": "MEDIUM",
  "risk_explanation": "Moderate acute febrile illness",
  "likely_causes": ["Malaria", "Typhoid"],
  "recommended_specialty": "Internal Medicine",
  "recommended_actions": ["Consult physician for blood test"],
  "warning_signs": ["Persistent high fever > 39C"],
  "home_care_tips": ["Oral hydration", "Tepid sponging"],
  "disclaimer": "This is an AI triage guidance."
}
\`\`\``;

    const parsed = aiTriageService.parseFinalAssessment(raw);
    expect(parsed.risk_level).toBe("MEDIUM");
    expect(parsed.recommended_specialty).toBe("Internal Medicine");
    expect(parsed.likely_causes).toContain("Malaria");
  });

  it("handles fallback if JSON block is missing in final assessment", () => {
    const raw = "The patient has a simple headache and needs rest.";
    const parsed = aiTriageService.parseFinalAssessment(raw);
    expect(parsed.risk_level).toBe("MEDIUM");
    expect(parsed.recommended_specialty).toBe("General Medicine");
  });
});

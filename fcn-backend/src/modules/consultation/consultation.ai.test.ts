import { describe, it, expect } from "vitest";
import {
  buildClinicalAiSystemPrompt,
  buildClinicalAiUserPrompt,
  type PatientClinicalData,
  type ChatMessageSummary
} from "./consultation-ai.prompts";
import { consultationAiService } from "./consultation-ai.service";

describe("Consultation AI Prompts & Parsing", () => {
  it("generates system prompt containing Ethiopian STG guidelines and safety requirements", () => {
    const prompt = buildClinicalAiSystemPrompt();
    expect(prompt).toContain("Senior Clinical Consultant");
    expect(prompt).toContain("Ethiopian Standard Treatment Guidelines");
    expect(prompt).toContain("Strict Allergy & Drug Safety Cross-Checking");
    expect(prompt).toContain("differential_diagnoses");
  });

  it("builds user prompt with patient profile, vitals, allergies and chat dialogue", () => {
    const patientData: PatientClinicalData = {
      fullName: "Abebe Bikila",
      ageYears: 34,
      gender: "Male",
      bloodType: "O+",
      knownAllergies: ["Penicillin"],
      chronicConditions: ["Hypertension"],
      vitals: {
        bpSystolic: 138,
        bpDiastolic: 88,
        heartRateBpm: 82,
        temperatureCelsius: 38.6,
        bloodGlucoseMgDl: null,
        spo2Percent: 97
      },
      activePrescriptions: [
        {
          drugName: "Amlodipine",
          dosage: "5mg",
          frequency: 1
        }
      ]
    };

    const messages: ChatMessageSummary[] = [
      {
        senderRole: "patient",
        senderName: "Abebe Bikila",
        content: "I have high fever, chills, and severe headache for 2 days.",
        sentAt: "2026-10-24T10:00:00Z"
      },
      {
        senderRole: "doctor",
        senderName: "Dr. Almaz",
        content: "Have you noticed any vomiting, confusion, or recent travel to malaria-endemic areas?",
        sentAt: "2026-10-24T10:01:00Z"
      }
    ];

    const userPrompt = buildClinicalAiUserPrompt(patientData, messages);
    expect(userPrompt).toContain("Abebe Bikila");
    expect(userPrompt).toContain("Penicillin");
    expect(userPrompt).toContain("Hypertension");
    expect(userPrompt).toContain("138/88 mmHg");
    expect(userPrompt).toContain("38.6 °C");
    expect(userPrompt).toContain("Amlodipine 5mg (x1/day)");
    expect(userPrompt).toContain("high fever, chills, and severe headache");
  });

  it("parses valid JSON response into ClinicalAiAssessment structure", () => {
    const mockAiResponse = JSON.stringify({
      consultation_summary: "Patient presents with acute febrile illness, joint pains, and chills.",
      differential_diagnoses: [
        {
          condition: "Uncomplicated Plasmodium falciparum Malaria",
          probability: "High",
          icd10_hint: "B50.9",
          reasoning: "Classic cyclical fever paroxysms, chills, and headache in endemic context.",
          supporting_symptoms: ["High fever", "Chills", "Headache"],
          key_distinguishing_features: "Absence of respiratory signs, positive exposure history."
        },
        {
          condition: "Acute Viral Upper Respiratory Infection",
          probability: "Low",
          icd10_hint: "J06.9",
          reasoning: "Fever present, but lack of cough or coryza makes this less likely.",
          supporting_symptoms: ["Fever"]
        }
      ],
      red_flags: ["Impaired consciousness or seizures", "Severe persistent vomiting"],
      allergy_warnings: ["Patient allergic to Penicillin - avoid beta-lactam antibiotics"],
      recommended_treatment: {
        first_line_medications: [
          {
            drug_name: "Artemether-Lumefantrine (Coartem)",
            dosage: "20mg/120mg",
            form: "Tablet",
            frequency_per_day: 2,
            duration_days: 3,
            instructions: "Take 4 tablets orally twice daily with milk/fatty food for 3 days as per Ethiopian STG",
            guideline_note: "Ethiopian STG 2024 first-line choice for uncomplicated falciparum malaria"
          },
          {
            drug_name: "Paracetamol",
            dosage: "1000mg",
            form: "Tablet",
            frequency_per_day: 3,
            duration_days: 3,
            instructions: "Take 1-2 tablets every 8 hours as needed for fever and headache (max 4g/day)"
          }
        ],
        non_pharmacological: ["Ensure oral rehydration with clean water/soup", "Tepid sponge bathing if temp > 38.5°C"],
        patient_counseling: ["Complete full 3-day course even if feeling better", "Seek immediate ER care if unable to drink"]
      },
      recommended_lab_tests: [
        {
          test_name: "Malaria Blood Film / Rapid Diagnostic Test (RDT)",
          rationale: "Confirm parasitic infection and determine species before or alongside therapy",
          urgency: "Immediate"
        },
        {
          test_name: "Complete Blood Count (CBC)",
          rationale: "Assess hemoglobin level and exclude severe anemia or thrombocytopenia",
          urgency: "Routine"
        }
      ],
      suggested_clinical_questions: [
        "Have you traveled to lowland or malaria-risk areas within the past 2 weeks?",
        "Are you able to keep oral fluids down without vomiting?"
      ]
    });

    const parsed = consultationAiService.parseAiResponse(mockAiResponse);
    expect(parsed.consultation_summary).toContain("acute febrile illness");
    expect(parsed.differential_diagnoses).toHaveLength(2);
    expect(parsed.differential_diagnoses[0].condition).toBe("Uncomplicated Plasmodium falciparum Malaria");
    expect(parsed.differential_diagnoses[0].probability).toBe("High");
    expect(parsed.red_flags).toContain("Impaired consciousness or seizures");
    expect(parsed.allergy_warnings[0]).toContain("Penicillin");
    expect(parsed.recommended_treatment.first_line_medications[0].drug_name).toBe("Artemether-Lumefantrine (Coartem)");
    expect(parsed.recommended_lab_tests[0].urgency).toBe("Immediate");
    expect(parsed.suggested_clinical_questions).toHaveLength(2);
  });

  it("handles markdown code fence wrapping smoothly", () => {
    const wrapped = `\`\`\`json
{
  "consultation_summary": "Test summary",
  "differential_diagnoses": [],
  "red_flags": [],
  "allergy_warnings": [],
  "recommended_treatment": {
    "first_line_medications": [],
    "non_pharmacological": [],
    "patient_counseling": []
  },
  "recommended_lab_tests": [],
  "suggested_clinical_questions": []
}
\`\`\``;

    const parsed = consultationAiService.parseAiResponse(wrapped);
    expect(parsed.consultation_summary).toBe("Test summary");
    expect(parsed.differential_diagnoses).toEqual([]);
  });

  it("throws AppError on completely invalid response", () => {
    expect(() => {
      consultationAiService.parseAiResponse("Sorry, I cannot assist with this request.");
    }).toThrowError(/could not be parsed/i);
  });
});

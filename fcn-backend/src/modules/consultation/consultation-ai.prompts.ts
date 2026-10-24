export interface PatientClinicalData {
  fullName: string;
  ageYears?: number | null;
  gender?: string | null;
  bloodType?: string | null;
  knownAllergies: string[];
  chronicConditions: string[];
  vitals: {
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    heartRateBpm?: number | null;
    temperatureCelsius?: number | null;
    bloodGlucoseMgDl?: number | null;
    spo2Percent?: number | null;
  };
  activePrescriptions: Array<{
    drugName: string;
    dosage?: string;
    frequency?: number;
  }>;
}

export interface ChatMessageSummary {
  senderRole: "doctor" | "patient";
  senderName: string;
  content: string;
  sentAt: string;
}

export function buildClinicalAiSystemPrompt(): string {
  return `You are an expert Senior Clinical Consultant and Medical Educator specializing in primary care, internal medicine, and telemedicine in Ethiopia.
You act as an advisory AI Clinical Co-Pilot to assist a licensed Ethiopian physician during a live telemedicine consultation.

YOUR CLINICAL MANDATE:
1. Contextualize the clinical picture: Synthesize the patient's demographic profile, known allergies, chronic conditions, latest vital signs, active medications, and the real-time consultation chat dialogue.
2. Formulate Evidence-Based Differential Diagnoses (DDx): Provide 2 to 4 ranked differential diagnoses with clear clinical reasoning, supporting symptoms from the consultation, and key distinguishing features.
3. Ethiopian Standard Treatment Guidelines (STG):
   - Prioritize essential medications approved and widely available under Ethiopian Standard Treatment Guidelines (e.g., Artemether-Lumefantrine / Coartem for malaria, Amoxicillin / Amoxicillin-Clavulanate for upper/lower RTI, Ciprofloxacin / Nitrofurantoin for UTI, Metformin / Glibenclamide for Type 2 Diabetes, Lisinopril / Amlodipine / Hydrochlorothiazide for Hypertension, ORS + Zinc for acute diarrhea, etc.).
4. Strict Allergy & Drug Safety Cross-Checking:
   - Carefully inspect the patient's known allergies. If a patient is allergic to penicillin, NEVER suggest amoxicillin, ampicillin, or beta-lactams; explicitly flag the allergy in "allergy_warnings" and suggest a safe alternative (e.g. Azithromycin, Doxycycline, or Ciprofloxacin depending on condition).
   - Check for interactions with current active medications.
5. Identify Critical Red Flags:
   - Note any alarm signs indicating severe illness requiring immediate physical emergency hospital referral (e.g., chest pain with diaphoresis, neurological deficits, severe dyspnea, signs of shock/sepsis, diabetic ketoacidosis, peritoneal signs).
6. Diagnostic Tests & Clinical Inquiries:
   - Suggest relevant laboratory/imaging investigations (e.g. CBC, malaria blood film/RDT, urinalysis, serum creatinine, CXR) with clinical rationale and urgency.
   - Suggest 2 to 4 specific follow-up questions the physician should ask the patient to definitively differentiate between the leading diagnoses.

OUTPUT REQUIREMENTS:
- You MUST respond ONLY with a single valid JSON object.
- Do NOT wrap in markdown code blocks like \`\`\`json.
- Do NOT include any introductory or concluding text.

JSON SCHEMA:
{
  "consultation_summary": "string (concise clinical summary of patient's chief complaints and current trajectory)",
  "differential_diagnoses": [
    {
      "condition": "string",
      "probability": "High" | "Moderate" | "Low",
      "icd10_hint": "string",
      "reasoning": "string",
      "supporting_symptoms": ["string"],
      "key_distinguishing_features": "string"
    }
  ],
  "red_flags": ["string"],
  "allergy_warnings": ["string"],
  "recommended_treatment": {
    "first_line_medications": [
      {
        "drug_name": "string",
        "dosage": "string (e.g. 500mg)",
        "form": "Tablet" | "Capsule" | "Liquid/Syrup" | "Injection" | "Cream/Ointment" | "Inhaler" | "Drops" | "Suppository",
        "frequency_per_day": 2,
        "duration_days": 5,
        "instructions": "string (clear directions e.g. Take 1 tablet orally twice daily after meals for 5 days)",
        "guideline_note": "string (e.g. Ethiopian STG first-line therapy)"
      }
    ],
    "non_pharmacological": ["string"],
    "patient_counseling": ["string"]
  },
  "recommended_lab_tests": [
    {
      "test_name": "string",
      "rationale": "string",
      "urgency": "Immediate" | "Routine"
    }
  ],
  "suggested_clinical_questions": ["string"]
}`;
}

export function buildClinicalAiUserPrompt(
  patientData: PatientClinicalData,
  chatMessages: ChatMessageSummary[]
): string {
  const vitalsText = [
    patientData.vitals.bpSystolic && patientData.vitals.bpDiastolic
      ? `Blood Pressure: ${patientData.vitals.bpSystolic}/${patientData.vitals.bpDiastolic} mmHg`
      : null,
    patientData.vitals.heartRateBpm ? `Heart Rate: ${patientData.vitals.heartRateBpm} bpm` : null,
    patientData.vitals.temperatureCelsius ? `Temperature: ${patientData.vitals.temperatureCelsius} °C` : null,
    patientData.vitals.bloodGlucoseMgDl ? `Blood Glucose: ${patientData.vitals.bloodGlucoseMgDl} mg/dL` : null,
    patientData.vitals.spo2Percent ? `Oxygen Saturation (SpO2): ${patientData.vitals.spo2Percent}%` : null
  ]
    .filter(Boolean)
    .join(", ");

  const allergiesText =
    patientData.knownAllergies.length > 0
      ? patientData.knownAllergies.join(", ")
      : "None reported / No known drug allergies (NKDA)";

  const chronicConditionsText =
    patientData.chronicConditions.length > 0
      ? patientData.chronicConditions.join(", ")
      : "None reported";

  const activeMedsText =
    patientData.activePrescriptions.length > 0
      ? patientData.activePrescriptions
          .map((m) => `${m.drugName} ${m.dosage || ""} (x${m.frequency || 1}/day)`)
          .join("; ")
      : "No active prescriptions on file";

  const conversationTranscript =
    chatMessages.length > 0
      ? chatMessages
          .map(
            (m) =>
              `[${m.senderRole.toUpperCase()} - ${m.senderName}]: ${m.content}`
          )
          .join("\n")
      : "No messages exchanged yet in this session.";

  return `PATIENT CLINICAL PROFILE:
- Patient Name: ${patientData.fullName}
- Age: ${patientData.ageYears ? `${patientData.ageYears} years old` : "Unknown / Adult"}
- Gender: ${patientData.gender || "Not specified"}
- Blood Type: ${patientData.bloodType || "Unknown"}
- Known Allergies: ${allergiesText}
- Chronic Conditions: ${chronicConditionsText}
- Current / Latest Vitals: ${vitalsText || "No vitals recorded recently"}
- Active Medications: ${activeMedsText}

CONSULTATION CONVERSATION TRANSCRIPT:
${conversationTranscript}

TASK:
Analyze the above patient context and dialogue. Synthesize the differential diagnoses, check drug safety against known allergies, identify any red flags, recommend Ethiopian STG aligned treatment with exact drug names/dosages/frequency, suggest diagnostic tests, and formulate key follow-up questions for the attending physician. Respond strictly with the required JSON schema.`;
}

import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import { decryptMessage, computeAge } from "./consultation.helpers";
import {
  buildClinicalAiSystemPrompt,
  buildClinicalAiUserPrompt,
  type PatientClinicalData,
  type ChatMessageSummary
} from "./consultation-ai.prompts";

export interface ClinicalAiDiagnosis {
  condition: string;
  probability: "High" | "Moderate" | "Low";
  icd10_hint?: string;
  reasoning: string;
  supporting_symptoms: string[];
  key_distinguishing_features?: string;
}

export interface ClinicalAiMedication {
  drug_name: string;
  dosage: string;
  form: string;
  frequency_per_day: number;
  duration_days: number;
  instructions: string;
  guideline_note?: string;
}

export interface ClinicalAiAssessment {
  consultation_summary: string;
  differential_diagnoses: ClinicalAiDiagnosis[];
  red_flags: string[];
  allergy_warnings: string[];
  recommended_treatment: {
    first_line_medications: ClinicalAiMedication[];
    non_pharmacological: string[];
    patient_counseling: string[];
  };
  recommended_lab_tests: {
    test_name: string;
    rationale: string;
    urgency: "Immediate" | "Routine";
  }[];
  suggested_clinical_questions: string[];
  analyzed_at: string;
}

export class ConsultationAiService {
  /**
   * Calls AI model (Gemini with hierarchy, fallback to DeepSeek)
   */
  private async executeModelCall(systemPrompt: string, userPrompt: string): Promise<string> {
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (geminiKey) {
      const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"];
      const body = {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2500,
          topP: 0.95
        }
      };

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          if (!response.ok) {
            let detail = "";
            try {
              const errData = (await response.json()) as any;
              detail = errData?.error?.message || response.statusText;
            } catch {
              detail = response.statusText;
            }
            logger.warn(`Clinical AI Gemini model ${model} returned ${response.status}`, { detail });
            continue;
          }

          const result = (await response.json()) as any;
          const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            logger.info("Clinical AI analysis generated via Gemini", { model });
            return text;
          }
        } catch (err: any) {
          logger.warn(`Clinical AI Gemini model ${model} exception`, { error: err.message });
        }
      }
    }

    if (env.DEEPSEEK_API_KEY) {
      try {
        const deepseekUrl = "https://api.deepseek.com/chat/completions";
        const model = env.DEEPSEEK_MODEL || "deepseek-chat";
        const response = await fetch(deepseekUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 2500
          })
        });

        if (response.ok) {
          const result = (await response.json()) as any;
          const text = result?.choices?.[0]?.message?.content?.trim();
          if (text) {
            logger.info("Clinical AI analysis generated via DeepSeek", { model });
            return text;
          }
        }
      } catch (err: any) {
        logger.error("Clinical AI DeepSeek call failed", { error: err.message });
      }
    }

    throw new AppError(
      "AI Clinical Assistant service is temporarily unavailable. Please verify API keys or try again shortly.",
      503,
      "AI_SERVICE_UNAVAILABLE"
    );
  }

  /**
   * Parses and validates raw LLM JSON response into a strictly typed ClinicalAiAssessment
   */
  public parseAiResponse(raw: string): ClinicalAiAssessment {
    let clean = raw.trim();

    // Strip markdown JSON codeblocks if present
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    // If there is any preamble or postamble, extract the outermost JSON object
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch (parseError: any) {
      logger.error("Failed to parse Clinical AI JSON response", { raw, error: parseError.message });
      throw new AppError(
        "AI response could not be parsed into clinical assessment format.",
        502,
        "AI_PARSE_ERROR"
      );
    }

    // Normalize and sanitize fields with fallback defaults
    const differentialDiagnoses: ClinicalAiDiagnosis[] = Array.isArray(parsed.differential_diagnoses)
      ? parsed.differential_diagnoses.map((d: any) => ({
          condition: String(d.condition || "Unspecified condition"),
          probability: ["High", "Moderate", "Low"].includes(d.probability) ? d.probability : "Moderate",
          icd10_hint: d.icd10_hint ? String(d.icd10_hint) : undefined,
          reasoning: String(d.reasoning || "Clinical correlation noted."),
          supporting_symptoms: Array.isArray(d.supporting_symptoms) ? d.supporting_symptoms.map(String) : [],
          key_distinguishing_features: d.key_distinguishing_features ? String(d.key_distinguishing_features) : undefined
        }))
      : [];

    const redFlags: string[] = Array.isArray(parsed.red_flags)
      ? parsed.red_flags.map(String).filter((s: string) => s.trim().length > 0)
      : [];

    const allergyWarnings: string[] = Array.isArray(parsed.allergy_warnings)
      ? parsed.allergy_warnings.map(String).filter((s: string) => s.trim().length > 0)
      : [];

    const firstLineMeds: ClinicalAiMedication[] = Array.isArray(parsed.recommended_treatment?.first_line_medications)
      ? parsed.recommended_treatment.first_line_medications.map((m: any) => ({
          drug_name: String(m.drug_name || "Unspecified medication"),
          dosage: String(m.dosage || "Standard therapeutic dose"),
          form: String(m.form || "Tablet"),
          frequency_per_day: typeof m.frequency_per_day === "number" ? m.frequency_per_day : 2,
          duration_days: typeof m.duration_days === "number" ? m.duration_days : 5,
          instructions: String(m.instructions || "Take as directed by physician."),
          guideline_note: m.guideline_note ? String(m.guideline_note) : undefined
        }))
      : [];

    const nonPharm: string[] = Array.isArray(parsed.recommended_treatment?.non_pharmacological)
      ? parsed.recommended_treatment.non_pharmacological.map(String)
      : [];

    const counseling: string[] = Array.isArray(parsed.recommended_treatment?.patient_counseling)
      ? parsed.recommended_treatment.patient_counseling.map(String)
      : [];

    const labTests = Array.isArray(parsed.recommended_lab_tests)
      ? parsed.recommended_lab_tests.map((t: any) => ({
          test_name: String(t.test_name || "Diagnostic evaluation"),
          rationale: String(t.rationale || "Clinical confirmation"),
          urgency: t.urgency === "Immediate" ? ("Immediate" as const) : ("Routine" as const)
        }))
      : [];

    const questions: string[] = Array.isArray(parsed.suggested_clinical_questions)
      ? parsed.suggested_clinical_questions.map(String).filter((q: string) => q.trim().length > 0)
      : [];

    return {
      consultation_summary: String(
        parsed.consultation_summary ||
          "Clinical consultation session analyzed. Review differentials and treatment guidelines below."
      ),
      differential_diagnoses: differentialDiagnoses,
      red_flags: redFlags,
      allergy_warnings: allergyWarnings,
      recommended_treatment: {
        first_line_medications: firstLineMeds,
        non_pharmacological: nonPharm,
        patient_counseling: counseling
      },
      recommended_lab_tests: labTests,
      suggested_clinical_questions: questions,
      analyzed_at: new Date().toISOString()
    };
  }

  /**
   * Aggregates consultation context and prompts AI model for differential diagnosis and Ethiopian STG treatment advice
   */
  public async generateConsultationAiAssessment(
    appointmentId: string,
    doctorId: string
  ): Promise<ClinicalAiAssessment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            patient_profile: true
          }
        },
        doctor: {
          select: {
            id: true,
            full_name: true
          }
        }
      }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    if (appointment.doctor_id !== doctorId) {
      throw new AppError(
        "Unauthorized. Only the assigned physician can access the AI Clinical Co-Pilot for this consultation.",
        403,
        "FORBIDDEN"
      );
    }

    const patientId = appointment.patient_id;
    const profile = appointment.patient.patient_profile;

    // Fetch vitals
    const [latestBp, latestGlucose, latestHr, latestTemp, latestSpo2] = await Promise.all([
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, bp_systolic: { not: null } },
        orderBy: { recorded_at: "desc" }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, blood_glucose_mg_dl: { not: null } },
        orderBy: { recorded_at: "desc" }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, heart_rate_bpm: { not: null } },
        orderBy: { recorded_at: "desc" }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, temperature_celsius: { not: null } },
        orderBy: { recorded_at: "desc" }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, spo2_percent: { not: null } },
        orderBy: { recorded_at: "desc" }
      })
    ]);

    // Fetch active prescriptions
    const activePrescriptions = await prisma.prescription.findMany({
      where: {
        patient_id: patientId,
        status: { in: ["active", "refill_due"] }
      },
      include: { medications: true },
      orderBy: { issued_at: "desc" },
      take: 10
    });

    const activeMedsList: Array<{ drugName: string; dosage?: string; frequency?: number }> = [];
    for (const rx of activePrescriptions) {
      for (const med of rx.medications) {
        activeMedsList.push({
          drugName: med.drug_name,
          dosage: med.strength,
          frequency: med.frequency_per_day
        });
      }
    }

    // Fetch decrypted consultation messages in chronological order (asc)
    const rawMessages = await prisma.message.findMany({
      where: { appointment_id: appointmentId, deleted_at: null },
      orderBy: { sent_at: "asc" },
      include: {
        sender: { select: { id: true, full_name: true } }
      }
    });

    const decrypted = rawMessages.map((msg) => decryptMessage(msg));
    const chatSummaries: ChatMessageSummary[] = decrypted
      .filter((m) => !m.is_system_message && m.message_text && m.message_text.trim().length > 0)
      .map((m) => ({
        senderRole: m.sender_user_id === appointment.doctor_id ? "doctor" : "patient",
        senderName: m.sender_name || (m.sender_user_id === appointment.doctor_id ? "Doctor" : "Patient"),
        content: m.message_text,
        sentAt: m.sent_at
      }));

    // Parse allergies and chronic conditions
    const knownAllergies: string[] = profile?.known_allergies
      ? profile.known_allergies.split(",").map((a) => a.trim()).filter(Boolean)
      : [];

    const chronicConditions: string[] = Array.isArray(profile?.chronic_conditions)
      ? profile.chronic_conditions
      : [];

    const patientData: PatientClinicalData = {
      fullName: appointment.patient.full_name,
      ageYears: computeAge(profile?.date_of_birth?.toISOString()),
      bloodType: profile?.blood_type,
      knownAllergies,
      chronicConditions,
      vitals: {
        bpSystolic: latestBp?.bp_systolic,
        bpDiastolic: latestBp?.bp_diastolic,
        heartRateBpm: latestHr?.heart_rate_bpm,
        temperatureCelsius: latestTemp?.temperature_celsius ? Number(latestTemp.temperature_celsius) : null,
        bloodGlucoseMgDl: latestGlucose?.blood_glucose_mg_dl ? Number(latestGlucose.blood_glucose_mg_dl) : null,
        spo2Percent: latestSpo2?.spo2_percent ? Number(latestSpo2.spo2_percent) : null
      },
      activePrescriptions: activeMedsList
    };

    const systemPrompt = buildClinicalAiSystemPrompt();
    const userPrompt = buildClinicalAiUserPrompt(patientData, chatSummaries);

    const rawResponse = await this.executeModelCall(systemPrompt, userPrompt);
    return this.parseAiResponse(rawResponse);
  }
}

export const consultationAiService = new ConsultationAiService();

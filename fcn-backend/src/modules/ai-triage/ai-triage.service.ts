import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../../config/database";
import { redis, redisGet, redisSet } from "../../config/redis";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { systemSettings } from "../../utils/system-settings";
import { logger } from "../../utils/logger";
import { buildSystemPrompt, buildRoundPrompt } from "./ai-triage.prompts";
import { notificationService } from "../notifications/notification.service";

const INPUT_SANITIZE_RE = /<[^>]*>|(['";\-–])|(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b)/gi;

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY
});

export interface PatientContext {
  full_name: string;
  age: number;
  blood_type: string | null;
  chronic_conditions: string[];
  known_allergies: string | null;
  active_medications: string[];
}

export interface ParsedAssessment {
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_explanation: string;
  likely_causes: string[];
  recommended_specialty: string;
  recommended_actions: string[];
  warning_signs: string[];
  home_care_tips: string[];
  disclaimer: string;
}

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  round?: number;
  timestamp: string;
}

function sanitizeInput(input: string): string {
  return input.replace(INPUT_SANITIZE_RE, "").trim();
}

function computeAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

class AITriageService {
  async getPatientContext(patientId: string): Promise<PatientContext> {
    const user = await prisma.user.findUnique({
      where: { id: patientId },
      include: {
        patient_profile: true
      }
    });

    if (!user) {
      throw new AppError("Patient not found", 404, "NOT_FOUND");
    }

    const profile = user.patient_profile;

    let age = 0;
    if (profile?.date_of_birth) {
      age = computeAge(profile.date_of_birth);
    }

    const activePrescriptions = await prisma.prescription.findMany({
      where: {
        patient_id: patientId,
        status: "active"
      },
      include: {
        medications: true
      }
    });

    const activeMedications: string[] = [];
    for (const rx of activePrescriptions) {
      for (const med of rx.medications) {
        activeMedications.push(`${med.drug_name} ${med.strength}`);
      }
    }

    return {
      full_name: user.full_name.split(" ")[0],
      age,
      blood_type: profile?.blood_type ?? null,
      chronic_conditions: profile?.chronic_conditions ?? [],
      known_allergies: profile?.known_allergies ?? null,
      active_medications: activeMedications
    };
  }

  async checkRateLimit(patientId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const key = `ai_triage:${patientId}:date:${today}`;
    const count = await redisGet(key);
    const currentCount = count ? parseInt(count, 10) : 0;
    if (currentCount >= 10) {
      throw new AppError("Daily AI assessment limit reached. Please book a consultation for urgent concerns.", 429, "RATE_LIMITED");
    }
    await redisSet(key, (currentCount + 1).toString(), 86400);
  }

  async startAssessment(
    patientId: string,
    language: string,
    initialSymptoms: string
  ): Promise<{ assessmentId: string; aiResponse: string; round: number }> {
    const triageEnabled = await systemSettings.get("ai_triage_enabled");
    if (triageEnabled !== "true") {
      throw new AppError("AI triage is currently unavailable", 503, "TRIAGE_UNAVAILABLE");
    }

    await this.checkRateLimit(patientId);

    const patientContext = await this.getPatientContext(patientId);
    const sanitizedSymptoms = sanitizeInput(initialSymptoms);

    const systemPrompt = buildSystemPrompt(language, patientContext);
    const roundPrompt = buildRoundPrompt(1, language);

    const response = await anthropic.messages.create({
      model: (await systemSettings.get("ai_model")) || "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt + "\n\n" + roundPrompt,
      messages: [
        {
          role: "user",
          content: `Patient's initial symptoms: ${sanitizedSymptoms}`
        }
      ]
    });

    const aiResponse = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const assessment = await prisma.symptomAssessment.create({
      data: {
        patient_id: patientId,
        language,
        initial_symptoms: sanitizedSymptoms,
        conversation: JSON.stringify([
          { role: "user", content: sanitizedSymptoms, timestamp: new Date().toISOString() },
          { role: "assistant", content: aiResponse, round: 1, timestamp: new Date().toISOString() }
        ]),
        round_count: 1,
        is_complete: false
      }
    });

    logger.info("AI triage assessment started", { assessmentId: assessment.id, patientId });

    return { assessmentId: assessment.id, aiResponse, round: 1 };
  }

  async continueConversation(
    assessmentId: string,
    patientId: string,
    patientMessage: string
  ): Promise<{
    aiResponse: string;
    round: number;
    isComplete: boolean;
    finalAssessment?: ParsedAssessment;
  }> {
    const assessment = await prisma.symptomAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new AppError("Assessment not found", 404, "NOT_FOUND");
    }

    if (assessment.patient_id !== patientId) {
      throw new AppError("Unauthorized access to this assessment", 403, "FORBIDDEN");
    }

    if (assessment.is_complete) {
      throw new AppError("Assessment already completed", 400, "ALREADY_COMPLETE");
    }

    const maxRounds = parseInt((await systemSettings.get("ai_max_rounds")) || "3", 10);

    if (assessment.round_count >= maxRounds) {
      return this.completeAssessment(assessmentId, patientId);
    }

    const conversation: ConversationEntry[] = JSON.parse(assessment.conversation as string);
    const sanitizedMessage = sanitizeInput(patientMessage);

    const newRound = assessment.round_count + 1;
    const patientContext = await this.getPatientContext(patientId);
    const systemPrompt = buildSystemPrompt(assessment.language, patientContext);
    const roundPrompt = buildRoundPrompt(newRound, assessment.language);

    const messages: Anthropic.MessageParam[] = conversation.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
    messages.push({
      role: "user",
      content: sanitizedMessage
    });

    const response = await anthropic.messages.create({
      model: (await systemSettings.get("ai_model")) || "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt + "\n\n" + roundPrompt,
      messages
    });

    const aiResponse = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    conversation.push(
      { role: "user", content: sanitizedMessage, timestamp: new Date().toISOString() },
      { role: "assistant", content: aiResponse, round: newRound, timestamp: new Date().toISOString() }
    );

    const isFinalRound = newRound >= maxRounds;
    const hasFinalAssessmentMarker = aiResponse.includes("FINAL_ASSESSMENT");
    const shouldComplete = isFinalRound || hasFinalAssessmentMarker;

    let parsed: ParsedAssessment | undefined;

    if (shouldComplete) {
      parsed = this.parseFinalAssessment(aiResponse);

      await prisma.symptomAssessment.update({
        where: { id: assessmentId },
        data: {
          conversation: JSON.stringify(conversation),
          round_count: newRound,
          is_complete: true,
          risk_level: parsed.risk_level,
          recommended_specialty: parsed.recommended_specialty,
          final_assessment: aiResponse
        }
      });

      await notificationService.send({
        userId: patientId,
        type: "ai_assessment_complete",
        title: "AI Health Assessment Complete",
        message: `Your symptom assessment is ready. Risk Level: ${parsed.risk_level}`,
        actionUrl: `/ai-check/history/${assessmentId}`,
        sendPush: true
      });

      logger.info("AI triage assessment completed", { assessmentId, patientId, riskLevel: parsed.risk_level });
    } else {
      await prisma.symptomAssessment.update({
        where: { id: assessmentId },
        data: {
          conversation: JSON.stringify(conversation),
          round_count: newRound
        }
      });
    }

    return { aiResponse, round: newRound, isComplete: shouldComplete, finalAssessment: parsed };
  }

  async completeAssessment(
    assessmentId: string,
    patientId: string
  ): Promise<{
    aiResponse: string;
    round: number;
    isComplete: boolean;
    finalAssessment?: ParsedAssessment;
  }> {
    const assessment = await prisma.symptomAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new AppError("Assessment not found", 404, "NOT_FOUND");
    }

    if (assessment.patient_id !== patientId) {
      throw new AppError("Unauthorized access to this assessment", 403, "FORBIDDEN");
    }

    if (assessment.is_complete) {
      const existingParsed = this.parseFinalAssessment(assessment.final_assessment || "");
      return {
        aiResponse: assessment.final_assessment || "",
        round: assessment.round_count,
        isComplete: true,
        finalAssessment: existingParsed
      };
    }

    const conversation: ConversationEntry[] = JSON.parse(assessment.conversation as string);
    const patientContext = await this.getPatientContext(patientId);
    const systemPrompt = buildSystemPrompt(assessment.language, patientContext);
    const roundPrompt = buildRoundPrompt(3, assessment.language);

    const messages: Anthropic.MessageParam[] = conversation.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await anthropic.messages.create({
      model: (await systemSettings.get("ai_model")) || "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt + "\n\n" + roundPrompt,
      messages
    });

    const aiResponse = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = this.parseFinalAssessment(aiResponse);

    conversation.push(
      { role: "assistant", content: aiResponse, round: 3, timestamp: new Date().toISOString() }
    );

    await prisma.symptomAssessment.update({
      where: { id: assessmentId },
      data: {
        conversation: JSON.stringify(conversation),
        round_count: 3,
        is_complete: true,
        risk_level: parsed.risk_level,
        recommended_specialty: parsed.recommended_specialty,
        final_assessment: aiResponse
      }
    });

    await notificationService.send({
      userId: patientId,
      type: "ai_assessment_complete",
      title: "AI Health Assessment Complete",
      message: `Your symptom assessment is ready. Risk Level: ${parsed.risk_level}`,
      actionUrl: `/ai-check/history/${assessmentId}`,
      sendPush: true
    });

    logger.info("AI triage assessment force-completed", { assessmentId, patientId, riskLevel: parsed.risk_level });

    return { aiResponse, round: 3, isComplete: true, finalAssessment: parsed };
  }

  parseFinalAssessment(aiResponse: string): ParsedAssessment {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*"risk_level"[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON block found in response");
      }
      const parsed = JSON.parse(jsonMatch[0]) as ParsedAssessment;
      return {
        risk_level: parsed.risk_level || "MEDIUM",
        risk_explanation: parsed.risk_explanation || "",
        likely_causes: parsed.likely_causes || [],
        recommended_specialty: parsed.recommended_specialty || "General Medicine",
        recommended_actions: parsed.recommended_actions || [],
        warning_signs: parsed.warning_signs || [],
        home_care_tips: parsed.home_care_tips || [],
        disclaimer: parsed.disclaimer || "This assessment is AI-generated guidance only and does not constitute a medical diagnosis. Please consult a licensed doctor for professional medical advice."
      };
    } catch {
      return {
        risk_level: "MEDIUM",
        risk_explanation: "Unable to fully parse the assessment. Please consult a doctor for proper evaluation.",
        likely_causes: [],
        recommended_specialty: "General Medicine",
        recommended_actions: ["Consult a healthcare professional for proper evaluation"],
        warning_signs: ["If symptoms worsen, seek immediate medical attention"],
        home_care_tips: [],
        disclaimer: "This assessment is AI-generated guidance only and does not constitute a medical diagnosis. Please consult a licensed doctor for professional medical advice."
      };
    }
  }

  async getAssessmentHistory(
    patientId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Array<{
      id: string;
      created_at: Date;
      initial_symptoms: string;
      risk_level: string | null;
      is_complete: boolean;
      recommended_specialty: string | null;
      language: string;
      round_count: number;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where = { patient_id: patientId };

    const [data, total] = await Promise.all([
      prisma.symptomAssessment.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          created_at: true,
          initial_symptoms: true,
          risk_level: true,
          is_complete: true,
          recommended_specialty: true,
          language: true,
          round_count: true
        }
      }),
      prisma.symptomAssessment.count({ where })
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        initial_symptoms: item.initial_symptoms.length > 100
          ? item.initial_symptoms.slice(0, 100) + "..."
          : item.initial_symptoms
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAssessmentById(assessmentId: string, userId: string, userRole: string): Promise<unknown> {
    const assessment = await prisma.symptomAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new AppError("Assessment not found", 404, "NOT_FOUND");
    }

    if (assessment.patient_id !== userId && userRole !== "doctor" && userRole !== "super_admin") {
      throw new AppError("Unauthorized access to this assessment", 403, "FORBIDDEN");
    }

    if (assessment.conversation && typeof assessment.conversation === "string") {
      try {
        (assessment as any).conversation = JSON.parse(assessment.conversation as string);
      } catch { }
    }

    return assessment;
  }

  async getDoctorPatientAssessments(
    doctorId: string,
    patientId: string
  ): Promise<unknown[]> {
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        doctor_id: doctorId,
        patient_id: patientId,
        status: { in: ["completed", "confirmed", "scheduled"] }
      }
    });

    if (!hasAppointment) {
      throw new AppError("No appointment found with this patient", 403, "NO_APPOINTMENT");
    }

    const assessments = await prisma.symptomAssessment.findMany({
      where: {
        patient_id: patientId,
        is_complete: true
      },
      orderBy: { created_at: "desc" }
    });

    return assessments.map((a) => {
      let conversation = a.conversation;
      if (typeof conversation === "string") {
        try {
          conversation = JSON.parse(conversation);
        } catch { }
      }
      return { ...a, conversation };
    });
  }

  async markBookingInitiated(assessmentId: string, patientId: string): Promise<void> {
    const assessment = await prisma.symptomAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new AppError("Assessment not found", 404, "NOT_FOUND");
    }

    if (assessment.patient_id !== patientId) {
      throw new AppError("Unauthorized", 403, "FORBIDDEN");
    }

    await prisma.symptomAssessment.update({
      where: { id: assessmentId },
      data: { booking_initiated: true }
    });
  }
}

export const aiTriageService = new AITriageService();

import { decrypt } from "../../utils/encryption";
import type { Message } from "@prisma/client";

export function decryptMessage(msg: Message & { sender: { id: string; full_name: string } }) {
  let decryptedText = msg.message_text;
  if (msg.message_type !== "system" && msg.message_text) {
    try {
      decryptedText = decrypt(msg.message_text, msg.message_iv);
    } catch {
      decryptedText = "[decryption error]";
    }
  }

  return {
    id: msg.id,
    conversation_id: msg.conversation_id,
    appointment_id: msg.appointment_id,
    sender_user_id: msg.sender_user_id,
    recipient_user_id: msg.recipient_user_id,
    sender_name: msg.sender.full_name,
    message_text: decryptedText,
    message_type: msg.message_type,
    file_url: msg.file_url,
    file_type: msg.file_type,
    file_name: msg.file_name,
    file_size_bytes: msg.file_size_bytes,
    is_system_message: msg.is_system_message,
    sent_at: msg.sent_at.toISOString(),
    read_at: msg.read_at?.toISOString() ?? null
  };
}

export function computeAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

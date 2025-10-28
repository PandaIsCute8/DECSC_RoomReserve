import { format } from "date-fns";

type ReservationDetails = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  purpose?: string | null;
  user: { id: string; email: string; name: string };
  room: { id: string; name: string; building: string; floor: number };
};

// In-memory reminder scheduler
const reminderTimers = new Map<string, NodeJS.Timeout>();

function formatRoomDetails(details: ReservationDetails): string {
  const prettyDate = format(new Date(details.date), "MMM dd, yyyy");
  return [
    `Room: ${details.room.name}`,
    `Building/Floor: ${details.room.building}, Floor ${details.room.floor}`,
    `Date: ${prettyDate}`,
    `Time: ${details.startTime} - ${details.endTime}`,
    details.purpose ? `Purpose: ${details.purpose}` : undefined,
  ].filter(Boolean).join("\n");
}

async function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null; // log-only mode
  }

  // Avoid static import to keep build working without the package installed
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const dynamicImport = new Function("m", "return import(m)");
  const nodemailer: any = await (dynamicImport("nodemailer"));
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transport;
}

async function sendEmail(to: string, subject: string, text: string) {
  const from = process.env.SMTP_FROM || "RoomReserve <no-reply@roomreserve.local>";
  const transport = await getTransport();
  if (!transport) {
    console.log("[mailer] (log-only) would send email:", { to, subject, text });
    return;
  }
  await transport.sendMail({ from, to, subject, text });
}

export async function sendReservationConfirmationEmail(details: ReservationDetails) {
  const subject = "Room reserved!";
  const body = [
    "Room reserved! Please make sure to be in the room within 15-minutes of your scheduled time slot.",
    "",
    "[ROOM DETAILS]",
    formatRoomDetails(details),
  ].join("\n");
  await sendEmail(details.user.email, subject, body);
}

export async function sendReservationReminderEmail(details: ReservationDetails) {
  const subject = "Reminder: Please confirm check-in";
  const body = [
    "Please confirm your successful check-in for your reserved room within 15 minutes of your given time slot on the RoomReservation Website.",
    "",
    "[ROOM DETAILS]",
    formatRoomDetails(details),
  ].join("\n");
  await sendEmail(details.user.email, subject, body);
}

export function scheduleFiveMinuteReminder(details: ReservationDetails) {
  // Clear any existing timer for this reservation
  cancelReminder(details.id);

  const start = new Date(`${details.date}T${details.startTime}:00`);
  const reminderAt = new Date(start.getTime() - 5 * 60 * 1000);
  const delay = reminderAt.getTime() - Date.now();

  if (delay <= 0) {
    // If the reminder time is in the past, send immediately (useful when testing)
    void sendReservationReminderEmail(details);
    return;
  }

  const timer = setTimeout(() => {
    void sendReservationReminderEmail(details);
    reminderTimers.delete(details.id);
  }, delay);

  reminderTimers.set(details.id, timer);
}

export function cancelReminder(reservationId: string) {
  const t = reminderTimers.get(reservationId);
  if (t) {
    clearTimeout(t);
    reminderTimers.delete(reservationId);
  }
}

export type { ReservationDetails };



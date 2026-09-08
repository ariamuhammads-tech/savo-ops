import { NextResponse } from "next/server";
import { sendB2BEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, recipientName, venueName, subject, text } = body;

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: "Parameter 'to', 'subject', dan 'text' wajib diisi." },
        { status: 400 }
      );
    }

    const result = await sendB2BEmail({
      to,
      recipientName: recipientName || "Owner / Management",
      venueName: venueName || "Kafe Mitra",
      subject,
      body: text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Gagal mengirim email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      simulated: result.simulated,
      sentAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Verify Xendit webhook token
    const xenditToken = req.headers.get("x-callback-token");
    if (xenditToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { external_id, status, paid_amount } = body;

    if (status === "PAID") {
      // Update transaction status in Supabase
      /*
      await supabase
        .from("transactions")
        .update({ status_pembayaran: "success" })
        .eq("xendit_external_id", external_id);
      */

      // Send WhatsApp notification (via Fonnte/Wablas)
      /*
      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: process.env.FONNTE_TOKEN! },
        body: JSON.stringify({
          target: process.env.ADMIN_WA_NUMBER,
          message: `✅ Pembayaran SUKSES!\nOrder ID: ${external_id}\nJumlah: Rp ${paid_amount.toLocaleString("id-ID")}`,
        }),
      });
      */

      console.log(`Payment success for order: ${external_id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

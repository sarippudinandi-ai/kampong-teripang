import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      nama,
      email,
      no_wa,
      paket,
      check_in,
      check_out,
      tamu,
      catatan,
      total_bayar,
      tipe_order,
      tanggal,
      peserta,
    } = body;

    // Validate required fields
    if (!nama || !email || !no_wa || !total_bayar) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Save to Supabase (uncomment when Supabase is configured)
    /*
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        nama_pemesan: nama,
        email,
        no_wa,
        total_bayar,
        status_pembayaran: "pending",
        tipe_order,
        detail_order: body,
      })
      .select()
      .single();

    if (error) throw error;
    */

    // Xendit Payment (uncomment when Xendit is configured)
    /*
    const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: `booking-${Date.now()}`,
        amount: total_bayar,
        payer_email: email,
        description: `Booking ${tipe_order} - ${paket}`,
        customer: {
          given_names: nama,
          email,
          mobile_number: no_wa,
        },
        success_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed`,
      }),
    });
    const xenditData = await xenditResponse.json();
    return NextResponse.json({ payment_url: xenditData.invoice_url });
    */

    // For now, return success (mock)
    return NextResponse.json({
      success: true,
      message: "Reservasi berhasil diterima",
      order_id: `ORD-${Date.now()}`,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

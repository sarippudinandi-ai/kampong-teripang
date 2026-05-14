import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, email, no_wa, alamat, items, total_bayar, tipe_order } = body;

    if (!nama || !email || !no_wa || !items || !total_bayar) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Xendit Invoice (uncomment when configured)
    /*
    const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: `order-${Date.now()}`,
        amount: total_bayar,
        payer_email: email,
        description: `Pembelian Produk Housome Store`,
        customer: {
          given_names: nama,
          email,
          mobile_number: no_wa,
          addresses: [{ street_line1: alamat, country: "ID" }],
        },
        items: items.map((item: { nama: string; harga: number; qty: number }) => ({
          name: item.nama,
          quantity: item.qty,
          price: item.harga,
        })),
        success_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failed`,
      }),
    });
    const xenditData = await xenditResponse.json();
    return NextResponse.json({ payment_url: xenditData.invoice_url });
    */

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil diterima",
      order_id: `SHOP-${Date.now()}`,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

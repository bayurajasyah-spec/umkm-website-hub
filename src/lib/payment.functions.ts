import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(99),
  price: z.number().int().min(0).max(100_000_000),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(6).max(20),
  address: z.string().min(5).max(300),
  destinationId: z.string().min(1).max(20),
  destinationLabel: z.string().min(1).max(200),
  courier: z.string().min(1).max(40),
  service: z.string().min(1).max(60),
  weightGrams: z.number().int().min(1).max(50000),
  shippingCost: z.number().int().min(0).max(10_000_000),
  items: z.array(itemSchema).min(1).max(50),
});

export interface OrderResult {
  orderCode: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  paymentStatus: string;
  qrisPayload: string | null;
  qrisImageUrl: string | null;
}

function makeOrderCode() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

/** Buat pesanan + tagihan QRIS. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => createOrderSchema.parse(d))
  .handler(async ({ data }): Promise<OrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const subtotal = data.items.reduce((a, x) => a + x.price * x.qty, 0);
    const total = subtotal + data.shippingCost;
    const orderCode = makeOrderCode();

    let qrisPayload: string | null = null;
    let qrisImageUrl: string | null = null;
    let paymentReference: string | null = null;

    const qrisKey = process.env["QRIS_API_KEY"];
    const qrisBase = process.env["QRIS_BASE_URL"] ?? "https://api.qrisly.id/v1";
    const merchantId = process.env["QRIS_MERCHANT_ID"];

    if (qrisKey) {
      const res = await fetch(`${qrisBase}/qris/create`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${qrisKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          reference_id: orderCode,
          amount: total,
          customer_name: data.customerName,
          description: `Pembayaran ${orderCode}`,
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error(`QRIS gateway gagal [${res.status}]: ${body}`);
        throw new Error(`Gagal membuat QRIS [${res.status}]: ${body}`);
      }
      let json: Record<string, unknown>;
      try {
        json = JSON.parse(body) as Record<string, unknown>;
      } catch {
        throw new Error("Respons gateway QRIS tidak valid");
      }
      const payload = (json["data"] ?? json) as Record<string, unknown>;
      qrisPayload = (payload["qris_string"] ?? payload["qr_string"] ?? null) as string | null;
      qrisImageUrl = (payload["qris_url"] ?? payload["qr_image_url"] ?? null) as string | null;
      paymentReference = String(payload["reference"] ?? payload["id"] ?? orderCode);
    }

    if (!Number.isSafeInteger(total) || total <= 0) {
      throw new Error("Total pesanan tidak valid");
    }

    const { error } = await supabaseAdmin.from("orders").insert({
      order_code: orderCode,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      address: data.address,
      destination_id: data.destinationId,
      destination_label: data.destinationLabel,
      courier: data.courier,
      service: data.service,
      weight_grams: data.weightGrams,
      shipping_cost: data.shippingCost,
      items: data.items,
      subtotal,
      total,
      payment_status: "pending",
      payment_reference: paymentReference,
      qris_payload: qrisPayload,
      qris_image_url: qrisImageUrl,
    });
    if (error) throw new Error(`Gagal menyimpan pesanan: ${error.message}`);

    return {
      orderCode,
      total,
      subtotal,
      shippingCost: data.shippingCost,
      paymentStatus: "pending",
      qrisPayload,
      qrisImageUrl,
    };
  });

/** Cek status pembayaran sebuah pesanan. */
export const getOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderCode: z.string().min(4).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select("order_code, payment_status, total, paid_at")
      .eq("order_code", data.orderCode)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Pesanan tidak ditemukan");
    return row;
  });

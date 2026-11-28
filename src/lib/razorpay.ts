import Razorpay from "razorpay";

export function getRazorpayClient():
  | { client: Razorpay; error?: undefined }
  | { client?: undefined; error: string } {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!key_id || !key_secret) {
    return {
      error:
        "Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.",
    };
  }

  try {
    const client = new Razorpay({
      key_id,
      key_secret,
    });
    return { client };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to initialize Razorpay client.",
    };
  }
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

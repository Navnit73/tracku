"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Loads Razorpay Checkout JavaScript SDK if not already loaded in the DOM.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  subscriptionId: string;
  keyId: string;
  name?: string;
  description?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  themeColor?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

/**
 * Opens Razorpay Checkout modal for a recurring subscription.
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !window.Razorpay) {
    if (options.onError) {
      options.onError(new Error("Failed to load Razorpay payment gateway. Please check your internet connection."));
    }
    return;
  }

  const razorpayConfig = {
    key: options.keyId,
    subscription_id: options.subscriptionId,
    name: "Expenseliy",
    description: options.description || "Expenseliy Pro Subscription",
    image: "/asset-management.png",
    prefill: {
      name: options.user?.name || "",
      email: options.user?.email || "",
    },
    notes: {
      source: "web_checkout",
    },
    theme: {
      color: options.themeColor || "#00D27B",
    },
    modal: {
      backdropclose: false,
      escape: true,
      handleback: true,
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      },
    },
    handler: async (response: any) => {
      try {
        await options.onSuccess(response);
      } catch (err) {
        if (options.onError) options.onError(err);
      }
    },
  };

  const rzp = new window.Razorpay(razorpayConfig);
  rzp.on("payment.failed", (response: any) => {
    if (options.onError) {
      options.onError(response.error || new Error("Payment failed or cancelled by user."));
    }
  });
  rzp.open();
}

export function RazorpayScript() {
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  return null;
}

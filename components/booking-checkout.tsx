"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { LoadingMark } from "@/components/brand/loading-mark";
import { formatCents } from "@/lib/utils";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type IntentResponse =
  | { clientSecret: string; paymentIntentId: string; amount: number }
  | { devSkip: true; amount: number }
  | { error: string; message?: string };

function CheckoutForm({
  amountCents,
  devSkip,
  onSuccess,
  onError,
}: {
  amountCents: number;
  devSkip: boolean;
  onSuccess: (paymentIntentId: string | null) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handlePay() {
    if (devSkip) {
      onSuccess(null);
      return;
    }
    if (!stripe || !elements) return;

    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setSubmitting(false);

    if (error) {
      onError(error.message ?? "Payment failed. Try again.");
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
      return;
    }
    onError("Payment did not complete. Try again.");
  }

  return (
    <>
      {!devSkip ? (
        <PaymentFields />
      ) : (
        <p className="text-sm text-ink-secondary rounded-2xl bg-elevated p-4">
          Stripe is not configured — booking will confirm without charging (dev only).
        </p>
      )}
      <Button
        className="mt-4 w-full"
        onClick={handlePay}
        disabled={submitting || (!devSkip && (!stripe || !elements))}
      >
        {submitting ? "Processing…" : devSkip ? "Confirm booking" : `Pay ${formatCents(amountCents)}`}
      </Button>
    </>
  );
}

function PaymentFields() {
  return (
    <div className="rounded-2xl bg-paper border border-hairline p-3">
      <PaymentElement
        options={{
          paymentMethodOrder: ["apple_pay", "card"],
          layout: "tabs",
        }}
      />
    </div>
  );
}

export function BookingCheckout({
  sessionId,
  onSuccess,
  onError,
}: {
  sessionId: string;
  onSuccess: (paymentIntentId: string | null) => void;
  onError?: (message: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [devSkip, setDevSkip] = useState(false);

  const fetchIntent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as IntentResponse;
      if (!res.ok) {
        const msg =
          "message" in data && data.message
            ? data.message
            : "error" in data
              ? String(data.error)
              : "Could not start checkout.";
        setError(msg);
        onError?.(msg);
        return;
      }
      if ("devSkip" in data && data.devSkip) {
        setDevSkip(true);
        setAmountCents(data.amount);
        setClientSecret(null);
        return;
      }
      if ("clientSecret" in data && data.clientSecret) {
        setDevSkip(false);
        setClientSecret(data.clientSecret);
        setAmountCents(data.amount);
        return;
      }
      setError("Invalid checkout response.");
    } catch {
      const msg = "Network error. Check your connection and try again.";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [sessionId, onError]);

  useEffect(() => {
    void fetchIntent();
  }, [fetchIntent]);

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingMark />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-coral/15 p-4">
        <p className="text-sm text-ink-primary">{error}</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => void fetchIntent()}>
          Try again
        </Button>
      </div>
    );
  }

  if (devSkip) {
    return (
      <CheckoutForm
        amountCents={amountCents}
        devSkip
        onSuccess={onSuccess}
        onError={(msg) => {
          setError(msg);
          onError?.(msg);
        }}
      />
    );
  }

  if (!clientSecret) {
    return <p className="text-sm text-ink-secondary">Checkout unavailable.</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1B3A4B",
            colorBackground: "#FAFAF7",
            colorText: "#0A0A0A",
            colorDanger: "#E87B5F",
            borderRadius: "12px",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
          },
        },
      }}
    >
      <CheckoutForm
        amountCents={amountCents}
        devSkip={false}
        onSuccess={onSuccess}
        onError={(msg) => {
          setError(msg);
          onError?.(msg);
        }}
      />
    </Elements>
  );
}

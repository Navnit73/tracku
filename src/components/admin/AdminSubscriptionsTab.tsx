"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Webhook,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAdminSubscriptionsAndWebhooks } from "@/app/actions/admin";
import { showToast } from "@/lib/toast";

export function AdminSubscriptionsTab() {
  const [subTab, setSubTab] = useState<"subscriptions" | "webhooks">("subscriptions");
  const [data, setData] = useState<{ subscriptions: any[]; webhookEvents: any[] }>({
    subscriptions: [],
    webhookEvents: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminSubscriptionsAndWebhooks();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        showToast.error("Load Failed", res.error || "Failed to load subscriptions");
      }
    } catch {
      showToast.error("Registry Error", "Error fetching subscription registry");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-surface border border-hairline rounded-xl w-fit text-xs font-bold">
          <button
            onClick={() => setSubTab("subscriptions")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "subscriptions"
                ? "bg-primary text-white shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Subscriptions Registry ({data.subscriptions.length})
          </button>
          <button
            onClick={() => setSubTab("webhooks")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === "webhooks"
                ? "bg-primary text-white shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Webhook className="w-3.5 h-3.5" /> Razorpay Webhooks ({data.webhookEvents.length})
          </button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          className="h-8.5 text-xs w-fit"
        >
          Refresh Registry
        </Button>
      </div>

      {/* Subscriptions View */}
      {subTab === "subscriptions" && (
        <Card className="border-hairline bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas border-b border-hairline text-ink-muted uppercase font-bold text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-3.5 px-4 font-bold">User / Account</th>
                  <th className="p-3.5 px-4 font-bold">Plan & Status</th>
                  <th className="p-3.5 px-4 font-bold">Billing Cycle</th>
                  <th className="p-3.5 px-4 font-bold">Razorpay Sub ID</th>
                  <th className="p-3.5 px-4 font-bold">Period End</th>
                  <th className="p-3.5 px-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-ink-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading subscriptions...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-ink-muted">
                      No active Razorpay subscription records found in database.
                    </td>
                  </tr>
                ) : (
                  data.subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3.5 px-4">
                        <span className="font-bold text-ink block">{sub.userName}</span>
                        <span className="text-[11px] text-ink-muted">{sub.userEmail}</span>
                      </td>
                      <td className="p-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-ink">{sub.plan}</span>
                          <Badge
                            variant={sub.status === "ACTIVE" ? "income" : "neutral"}
                            size="sm"
                            className="font-bold text-[10px]"
                          >
                            {sub.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3.5 px-4 text-ink-muted whitespace-nowrap">
                        {sub.cancelAtPeriodEnd ? (
                          <span className="text-warning font-semibold">Cancelling at period end</span>
                        ) : (
                          <span className="text-income font-medium">Auto-renewing</span>
                        )}
                      </td>
                      <td className="p-3.5 px-4 font-mono text-[11px] text-ink whitespace-nowrap">
                        {sub.razorpaySubscriptionId}
                      </td>
                      <td className="p-3.5 px-4 text-ink-muted whitespace-nowrap">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3.5 px-4 text-right font-black text-ink whitespace-nowrap">
                        ${sub.amount} {sub.currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Webhooks View */}
      {subTab === "webhooks" && (
        <Card className="border-hairline bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas border-b border-hairline text-ink-muted uppercase font-bold text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-3.5 px-4 font-bold">Event Type</th>
                  <th className="p-3.5 px-4 font-bold">Status</th>
                  <th className="p-3.5 px-4 font-bold">Razorpay Event ID</th>
                  <th className="p-3.5 px-4 font-bold">Received At</th>
                  <th className="p-3.5 px-4 font-bold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-ink-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading webhook logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.webhookEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-ink-muted">
                      No webhook event audit records found.
                    </td>
                  </tr>
                ) : (
                  data.webhookEvents.map((w) => (
                    <tr key={w.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3.5 px-4 font-mono font-bold text-primary">
                        {w.eventType}
                      </td>
                      <td className="p-3.5 px-4 whitespace-nowrap">
                        {w.processed ? (
                          <Badge variant="income" size="sm" className="font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Processed
                          </Badge>
                        ) : (
                          <Badge variant="expense" size="sm" className="font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3 mr-1" /> Error / Pending
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5 px-4 font-mono text-[11px] text-ink-muted whitespace-nowrap">
                        {w.razorpayEventId}
                      </td>
                      <td className="p-3.5 px-4 text-ink-muted whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 px-4 text-right text-[11px] text-ink-muted">
                        {w.error ? <span className="text-expense font-semibold">{w.error}</span> : "Success"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

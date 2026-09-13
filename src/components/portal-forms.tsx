"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { leadSchema } from "@/lib/validation";
import {
  serviceNames,
  userStatuses,
  leadStatuses,
  paymentStatuses,
} from "@/lib/constants";
import {
  calculateCommission,
  rupeesToPaise,
  type Tier,
} from "@/lib/commission";
import { money, label } from "@/lib/utils";
import { mutate } from "@/app/actions";
import { Button } from "./ui/button";
type Result = { ok: boolean; message: string; id?: string };
function Status({ value }: { value: Result | null }) {
  return value ? (
    <div role="status" className={"form-status" + (!value.ok ? " error" : "")}>
      {value.message}
    </div>
  ) : null;
}
export function LeadForm({ code }: { code: string }) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof leadSchema>, unknown, z.output<typeof leadSchema>>(
    {
      resolver: zodResolver(leadSchema),
      defaultValues: { services: [], email: "", presence: "", notes: "" },
    },
  );
  return (
    <>
      <div className="info-banner">
        Attributed automatically to your account · <strong>{code}</strong>
      </div>
      <form
        onSubmit={handleSubmit(async (v) => {
          const r = await mutate("createLead", "", v);
          setResult(r);
          if (r.ok) router.push("/influencer/leads/" + r.id);
        })}
        className="form-panel form-grid"
      >
        {[
          ["businessName", "Business name"],
          ["contactName", "Contact person"],
          ["phone", "Phone number"],
          ["whatsapp", "WhatsApp number"],
          ["email", "Email (optional)"],
          ["category", "Business category"],
          ["city", "City"],
          ["state", "State"],
          ["website", "Website URL (optional)"],
          ["instagramUrl", "Instagram URL (optional)"],
          ["budget", "Estimated project budget"],
          ["contactTime", "Preferred contact time"],
        ].map(([key, title]) => {
          const name = key as keyof z.input<typeof leadSchema>;
          return (
            <div className="field" key={key}>
              <label htmlFor={key}>{title}</label>
              <input
                id={key}
                type={
                  key === "email"
                    ? "email"
                    : key === "website" || key === "instagramUrl"
                      ? "url"
                      : "text"
                }
                placeholder={
                  key === "website" ? "https://example.com" : undefined
                }
                {...register(name)}
              />
              {errors[name] && (
                <small className="field-error">{errors[name]?.message}</small>
              )}
            </div>
          );
        })}
        <fieldset className="span-2">
          <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
            Interested services
          </legend>
          <div className="service-options">
            {serviceNames.map((s) => (
              <label className="check-field" key={s}>
                <input type="checkbox" value={s} {...register("services")} />
                {s}
              </label>
            ))}
          </div>
          {errors.services && (
            <p className="field-error">{errors.services.message}</p>
          )}
        </fieldset>
        <div className="field span-2">
          <label htmlFor="presence">Current online presence</label>
          <textarea id="presence" {...register("presence")} />
        </div>
        <div className="field span-2">
          <label htmlFor="notes">Your notes</label>
          <textarea id="notes" {...register("notes")} />
        </div>
        <div className="span-2">
          <label className="check-field">
            <input type="checkbox" {...register("consent")} />I confirm that
            this customer has agreed to share their contact details with
            ScaleNex Digital and be contacted about these services.
          </label>
          {errors.consent && (
            <p className="field-error">{errors.consent.message}</p>
          )}
        </div>
        <div className="span-2">
          <Status value={result} />
        </div>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting…" : "Submit lead"}
        </Button>
      </form>
    </>
  );
}
type UserFields = {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  city: string;
  state: string;
  status: string;
  commissionPlan: string;
  overridePercentage?: number;
  internalNotes?: string;
};
export function UserForm({
  id,
  initial,
}: {
  id?: string;
  initial?: UserFields;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  return (
    <form
      className="form-panel form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        const v = {
          ...Object.fromEntries(f),
          overridePercentage: f.get("overridePercentage")
            ? Number(f.get("overridePercentage"))
            : undefined,
          ...(id ? { regenerate: f.get("regenerate") === "on" } : {}),
        };
        const r = await mutate(id ? "editUser" : "createUser", id || "", v);
        setResult(r);
        setBusy(false);
        if (r.ok) {
          if (!id) router.push("/admin/influencers/" + r.id);
          else router.refresh();
        }
      }}
    >
      {[
        ["name", "Full name"],
        ["email", "Email"],
        ["phone", "Phone number"],
        ["instagram", "Instagram handle"],
        ["city", "City"],
        ["state", "State"],
        ...(!id ? [["password", "Temporary password"]] : []),
      ].map(([key, title]) => (
        <div className="field" key={key}>
          <label htmlFor={key}>{title}</label>
          <input
            id={key}
            name={key}
            required
            type={
              key === "password"
                ? "password"
                : key === "email"
                  ? "email"
                  : "text"
            }
            minLength={key === "password" ? 12 : 1}
            maxLength={key === "password" ? 72 : 200}
            defaultValue={initial?.[key as keyof UserFields]}
          />
          {key === "password" && (
            <small>
              At least 12 characters. The partner must change this on first
              login.
            </small>
          )}
        </div>
      ))}
      {id ? (
        <input
          type="hidden"
          name="status"
          value={initial?.status || "ACTIVE"}
        />
      ) : (
        <div className="field">
          <label htmlFor="status">Account status</label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status || "ACTIVE"}
          >
            {userStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor="commissionPlan">Commission plan</label>
        <select
          id="commissionPlan"
          name="commissionPlan"
          defaultValue={initial?.commissionPlan || "DEFAULT"}
        >
          <option value="DEFAULT">Standard configurable tiers</option>
          <option value="OVERRIDE">Custom fixed percentage</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="overridePercentage">
          Custom percentage (if applicable)
        </label>
        <input
          id="overridePercentage"
          name="overridePercentage"
          type="number"
          min="0"
          max="100"
          defaultValue={initial?.overridePercentage}
        />
      </div>
      <div className="field span-2">
        <label htmlFor="internalNotes">Internal notes</label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          defaultValue={initial?.internalNotes}
        />
        <small>Visible to administrators only.</small>
      </div>
      {id && (
        <>
          <div className="field span-2">
            <label htmlFor="reason">Reason for changes</label>
            <input id="reason" name="reason" required />
          </div>
          <label className="check-field span-2">
            <input type="checkbox" name="regenerate" />
            Generate a new referral code. Existing leads retain their original
            code.
          </label>
        </>
      )}
      <div className="span-2">
        <Status value={result} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy
          ? "Saving…"
          : id
            ? "Save account changes"
            : "Create influencer account"}
      </Button>
    </form>
  );
}

export function UserStatusForm({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  return (
    <form
      id="status-update"
      className="form-panel form-grid"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const values = Object.fromEntries(new FormData(event.currentTarget));
        const response = await mutate("updateUserStatus", id, values);
        setResult(response);
        setBusy(false);
        if (response.ok) router.refresh();
      }}
    >
      <div className="span-2">
        <h2 style={{ fontSize: 22 }}>Update account status</h2>
        <p>This change immediately controls the influencer’s login access.</p>
      </div>
      <div className="field">
        <label htmlFor="account-status">Account status</label>
        <select id="account-status" name="status" defaultValue={status}>
          {userStatuses.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="status-reason">Reason for status change</label>
        <input
          id="status-reason"
          name="reason"
          required
          minLength={1}
          maxLength={500}
          placeholder="For example: Account reviewed and approved"
        />
      </div>
      <div className="span-2">
        <Status value={result} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}
export function LeadStatusForm({
  id,
  status,
  visibleNote = "",
  internalNote = "",
  duplicate = false,
}: {
  id: string;
  status: string;
  visibleNote?: string;
  internalNote?: string;
  duplicate?: boolean;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="form-panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setResult(
          await mutate(
            "updateLead",
            id,
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        );
        setBusy(false);
      }}
    >
      <h2>Update lead</h2>
      {duplicate && (
        <div className="notice">
          Possible duplicate. Investigate matching records before approving
          ownership. Start the reason with “Ownership resolved:” to clear the
          review flag and retain this attribution, or select Duplicate to reject
          it.
        </div>
      )}
      <div className="field">
        <label htmlFor="lead-status">Official status</label>
        <select id="lead-status" name="status" defaultValue={status}>
          {leadStatuses.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="reason">Reason / ownership decision</label>
        <textarea
          id="reason"
          name="reason"
          placeholder="Required for lost, duplicate, or invalid leads"
        />
      </div>
      <div className="field">
        <label htmlFor="visibleNote">Partner-visible note</label>
        <textarea
          id="visibleNote"
          name="visibleNote"
          defaultValue={visibleNote}
        />
      </div>
      <div className="field">
        <label htmlFor="internalNote">Internal note</label>
        <textarea
          id="internalNote"
          name="internalNote"
          defaultValue={internalNote}
        />
      </div>
      <Status value={result} />
      <Button disabled={busy} type="submit">
        {busy ? "Saving…" : "Save status and notes"}
      </Button>
    </form>
  );
}
export type PaymentFields = {
  projectPaise: number;
  receivedPaise: number;
  approvedPaise: number;
  percentage: number;
  status: string;
  method: string;
  transactionId: string;
  paymentDate: string;
  adminNote: string;
  visibleNote: string;
  revision: number;
};
export function PaymentForm({
  id,
  initial,
  tiers,
}: {
  id: string;
  initial?: PaymentFields;
  tiers: Tier[];
}) {
  const [project, setProject] = useState(
    String((initial?.projectPaise || 0) / 100),
  );
  const [received, setReceived] = useState(
    String((initial?.receivedPaise || 0) / 100),
  );
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  let percentage = 0,
    calculatedPaise = 0;
  try {
    const calc = calculateCommission(
      rupeesToPaise(project),
      rupeesToPaise(received),
      initial
        ? [{ minPaise: 0, maxPaise: null, percentage: initial.percentage }]
        : tiers,
    );
    percentage = calc.percentage;
    calculatedPaise = calc.calculatedPaise;
  } catch {
    /* Invalid inputs are displayed by server validation on submit. */
  }
  return (
    <form
      className="form-panel form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        setResult(
          await mutate("payment", id, {
            ...Object.fromEntries(f),
            confirmed: f.get("confirmed") === "on",
            revision: initial?.revision || 0,
          }),
        );
        setBusy(false);
      }}
    >
      <h2 className="span-2">Commission & payment</h2>
      {initial?.status === "PAID" && (
        <div className="info-banner span-2">
          This paid record is locked to preserve financial history.
        </div>
      )}
      <div className="field">
        <label htmlFor="projectValue">Project value (₹)</label>
        <input
          id="projectValue"
          name="projectValue"
          inputMode="decimal"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="received">Eligible client payment received (₹)</label>
        <input
          id="received"
          name="received"
          inputMode="decimal"
          value={received}
          onChange={(e) => setReceived(e.target.value)}
          required
        />
      </div>
      <div className="financial-summary span-2">
        <div>
          <small>Applied rate{initial ? " (saved snapshot)" : ""}</small>
          <strong>{percentage}%</strong>
        </div>
        <div>
          <small>Calculated commission</small>
          <strong>{money(calculatedPaise)}</strong>
        </div>
        <div>
          <small>Calculation basis</small>
          <strong style={{ fontSize: 14 }}>Client receipts</strong>
        </div>
      </div>
      <div className="field">
        <label htmlFor="approved">Final approved commission (₹)</label>
        <input
          id="approved"
          name="approved"
          inputMode="decimal"
          defaultValue={String((initial?.approvedPaise || 0) / 100)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="payment-status">Payment status</label>
        <select
          id="payment-status"
          name="status"
          defaultValue={initial?.status || "PENDING_CLIENT_PAYMENT"}
        >
          {paymentStatuses.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>
      {[
        ["method", "Payment method"],
        ["transactionId", "Transaction ID"],
        ["paymentDate", "Payment date"],
      ].map(([key, title]) => (
        <div className="field" key={key}>
          <label htmlFor={key}>{title}</label>
          <input
            id={key}
            name={key}
            type={key === "paymentDate" ? "date" : "text"}
            defaultValue={
              initial?.[key as "method" | "transactionId" | "paymentDate"]
            }
          />
        </div>
      ))}
      <div className="field span-2">
        <label htmlFor="paymentReason">Reason for financial update</label>
        <input id="paymentReason" name="reason" required />
      </div>
      <div className="field">
        <label htmlFor="adminNote">Internal payment note</label>
        <textarea
          id="adminNote"
          name="adminNote"
          defaultValue={initial?.adminNote}
        />
      </div>
      <div className="field">
        <label htmlFor="paymentVisibleNote">Partner-visible payment note</label>
        <textarea
          id="paymentVisibleNote"
          name="visibleNote"
          defaultValue={initial?.visibleNote}
        />
      </div>
      <label className="check-field span-2">
        <input type="checkbox" name="confirmed" required />I have reviewed the
        project value, actual eligible receipts, applied rate, calculated
        commission, and final approved amount. I confirm this financial update.
      </label>
      <div className="span-2">
        <Status value={result} />
      </div>
      <Button disabled={busy || initial?.status === "PAID"} type="submit">
        {busy ? "Saving…" : "Confirm and save payment"}
      </Button>
    </form>
  );
}
export function RulesForm({ tiers }: { tiers: Tier[] }) {
  const [rows, setRows] = useState(tiers);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="form-panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setResult(await mutate("rules", "", rows));
        setBusy(false);
      }}
    >
      <h2>Commission tiers</h2>
      <p>
        Rates are selected by project value and applied to eligible client
        payments. Existing payment snapshots remain unchanged.
      </p>
      {rows.map((row, i) => (
        <div className="form-grid" key={i}>
          <div className="field">
            <label htmlFor={"min" + i}>
              Tier {i + 1} minimum (₹, inclusive)
            </label>
            <input
              id={"min" + i}
              type="number"
              min="0"
              step="0.01"
              value={row.minPaise / 100}
              onChange={(e) =>
                setRows(
                  rows.map((r, j) =>
                    j === i
                      ? {
                          ...r,
                          minPaise: Math.round(Number(e.target.value) * 100),
                        }
                      : r,
                  ),
                )
              }
            />
          </div>
          <div className="field">
            <label htmlFor={"max" + i}>
              Maximum (₹, exclusive; empty = unlimited)
            </label>
            <input
              id={"max" + i}
              type="number"
              min="0"
              step="0.01"
              value={row.maxPaise === null ? "" : row.maxPaise / 100}
              onChange={(e) =>
                setRows(
                  rows.map((r, j) =>
                    j === i
                      ? {
                          ...r,
                          maxPaise:
                            e.target.value === ""
                              ? null
                              : Math.round(Number(e.target.value) * 100),
                        }
                      : r,
                  ),
                )
              }
            />
          </div>
          <div className="field">
            <label htmlFor={"percent" + i}>Commission percentage</label>
            <input
              id={"percent" + i}
              type="number"
              min="0"
              max="100"
              value={row.percentage}
              onChange={(e) =>
                setRows(
                  rows.map((r, j) =>
                    j === i ? { ...r, percentage: Number(e.target.value) } : r,
                  ),
                )
              }
            />
          </div>
        </div>
      ))}
      <label className="check-field">
        <input type="checkbox" required />I confirm these tiers apply to new
        commission records.
      </label>
      <Status value={result} />
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save commission rules"}
      </Button>
    </form>
  );
}

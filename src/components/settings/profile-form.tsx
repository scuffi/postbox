"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/auth/client";
import { dispatchProfileNameChanged } from "@/lib/profile/name-client";
import { ProfileAvatarForm } from "./profile-avatar-form";
import type { ProfileFormProps, ProfileFormResponse } from "./types";

export function ProfileForm({
  initialName,
  initialResetEmail,
  email,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [resetEmail, setResetEmail] = useState(initialResetEmail);
  const [savedName, setSavedName] = useState(initialName);
  const [savedResetEmail, setSavedResetEmail] = useState(initialResetEmail);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRecovery, setSavingRecovery] = useState(false);

  async function saveProfile(nextName: string, nextResetEmail: string) {
    try {
      const res = await authFetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName, resetEmail: nextResetEmail }),
      });
      const data = (await res.json()) as ProfileFormResponse;

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to update account",
        );
      }

      const savedName = data.user?.name ?? nextName.trim();
      const savedResetEmail = data.user?.resetEmail ?? "";
      setName(savedName);
      setResetEmail(savedResetEmail);
      setSavedName(savedName);
      setSavedResetEmail(savedResetEmail);
      dispatchProfileNameChanged(savedName);
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Failed to update account");
    }
  }

  async function onProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      await saveProfile(name, savedResetEmail);
      setProfileStatus("Saved");
    } catch (error) {
      setProfileStatus(
        error instanceof Error ? error.message : "Failed to update account",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function onRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRecovery(true);
    setRecoveryStatus(null);
    try {
      await saveProfile(savedName, resetEmail);
      setRecoveryStatus("Saved");
    } catch (error) {
      setRecoveryStatus(
        error instanceof Error
          ? error.message
          : "Failed to update recovery email",
      );
    } finally {
      setSavingRecovery(false);
    }
  }

  return (
    <>
      <form
        onSubmit={onProfileSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] sm:p-6"
      >
        <div className="flex items-center gap-4">
          <ProfileAvatarForm name={name} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Profile picture
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Choose a picture to show across your account.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountEmail">Current email</Label>
          <Input
            id="accountEmail"
            value={email}
            type="email"
            readOnly
            aria-readonly="true"
            className="bg-muted text-muted-foreground dark:bg-muted"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button
            type="submit"
            disabled={savingProfile || name.trim() === savedName}
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
          {profileStatus && (
            <p className="animate-fade-in text-[13px] text-muted-foreground">{profileStatus}</p>
          )}
        </div>
      </form>

      <form
        onSubmit={onRecoverySubmit}
        className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] sm:p-6"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Recovery email
          </h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Used to recover access if you cannot sign in.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resetEmail">Email address</Label>
          <Input
            id="resetEmail"
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
            type="email"
            placeholder="recovery@example.com"
          />
        </div>
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button
            type="submit"
            disabled={savingRecovery || resetEmail.trim() === savedResetEmail}
          >
            {savingRecovery ? "Saving…" : "Save recovery email"}
          </Button>
          {recoveryStatus && (
            <p className="animate-fade-in text-[13px] text-muted-foreground">{recoveryStatus}</p>
          )}
        </div>
      </form>
    </>
  );
}

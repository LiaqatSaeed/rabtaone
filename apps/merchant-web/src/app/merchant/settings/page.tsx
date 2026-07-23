"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const MOBILE_APP_URL = process.env.NEXT_PUBLIC_MOBILE_APP_URL || "http://localhost:3001";

type MerchantProfile = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  whatsapp: string | null;
  categories: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
};

export default function MerchantSettingsPage() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [categoriesInput, setCategoriesInput] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await apiFetch<{ profile: MerchantProfile }>("/api/v1/me");
        if (!mounted) return;
        setProfile(data.profile);
        setSlug(data.profile.slug || "");
        setDescription(data.profile.description || "");
        setWhatsapp(data.profile.whatsapp || "");
        setCategoriesInput((data.profile.categories || []).join(", "));
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const categories = categoriesInput
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const updated = await apiFetch<MerchantProfile>("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
          categories,
        }),
      });
      setProfile(updated);
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    setError(null);
    try {
      const result = await apiUpload<{ logoUrl: string }>("/api/v1/me/avatar", file);
      setProfile((prev) => (prev ? { ...prev, logoUrl: result.logoUrl } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadBanner = async (file: File) => {
    setUploadingBanner(true);
    setError(null);
    try {
      const result = await apiUpload<{ bannerUrl: string }>("/api/v1/me/banner", file);
      setProfile((prev) => (prev ? { ...prev, bannerUrl: result.bannerUrl } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">Manage your public storefront page.</p>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}
      {message && <div className="text-sm text-emerald-600">{message}</div>}

      <Card>
        <CardHeader title="Storefront" subtitle="Shown on your public shop page" />
        <CardBody>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="your-shop-name"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
              <p className="mt-1 text-xs text-slate-500">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp number</label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="+15551234567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categories</label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Pharmacy, Health, Wellness"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Comma-separated.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
                {profile?.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }}
                  className="block w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cover image</label>
                {profile?.bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.bannerUrl} alt="Cover" className="h-16 w-28 rounded-lg object-cover mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingBanner}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadBanner(file);
                  }}
                  className="block w-full text-sm"
                />
              </div>
            </div>

            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {profile?.slug && (
        <Card>
          <CardHeader title="Public page" />
          <CardBody>
            <p className="text-sm text-slate-600">
              Your storefront is live at{" "}
              <a
                href={`${MOBILE_APP_URL}/shop/${profile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {MOBILE_APP_URL}/shop/{profile.slug}
              </a>
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

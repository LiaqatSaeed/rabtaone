import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7101";

type PublicMerchant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industryType: string;
  lat: number;
  lng: number;
  serviceKm: number;
  hasDelivery: boolean;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string | null;
  categories: string[];
};

async function getMerchant(slug: string): Promise<PublicMerchant | null> {
  const res = await fetch(`${API_BASE}/api/v1/public/merchants/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load merchant");
  const data = await res.json();
  return data.data as PublicMerchant;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const merchant = await getMerchant(params.slug);
  if (!merchant) return { title: "Shop not found" };

  const description = merchant.description || `${merchant.name} on RabtaOne`;
  const image = merchant.bannerUrl || merchant.logoUrl || undefined;

  return {
    title: `${merchant.name} | RabtaOne`,
    description,
    openGraph: {
      title: merchant.name,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

function whatsappHref(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function mapEmbedSrc(lat: number, lng: number) {
  const delta = 0.01;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const merchant = await getMerchant(params.slug);
  if (!merchant) notFound();

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="h-40 w-full bg-slate-200 overflow-hidden">
        {merchant.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={merchant.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="px-5 -mt-10">
        <div className="flex items-end gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white shadow-md border border-slate-100 overflow-hidden flex items-center justify-center">
            {merchant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={merchant.logoUrl} alt={merchant.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-slate-400">
                {merchant.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">{merchant.name}</h1>
          <p className="text-sm text-slate-500">{merchant.industryType}</p>
          {merchant.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {merchant.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {merchant.description && (
          <p className="mt-4 text-sm text-slate-700 leading-relaxed">{merchant.description}</p>
        )}

        <div className="mt-5 rounded-xl overflow-hidden border border-slate-200">
          <iframe
            title="Location"
            src={mapEmbedSrc(merchant.lat, merchant.lng)}
            className="w-full h-48 border-0"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Delivers within {merchant.serviceKm} km{merchant.hasDelivery ? "" : " (pickup only)"}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/user/new?merchantSlug=${merchant.slug}`}>
            <button className="w-full rounded-lg bg-indigo-600 text-white text-sm font-semibold py-3">
              Place Order
            </button>
          </Link>
          {merchant.whatsapp && (
            <a href={whatsappHref(merchant.whatsapp)} target="_blank" rel="noreferrer">
              <button className="w-full rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold py-3">
                Message on WhatsApp
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Static map. Prefers Mapbox static tiles when token present, falls back to a
 * minimal SVG illustration so we never ship a broken grey box.
 */
export function StaticMap({
  lat,
  lng,
  zoom = 15,
  height = 160,
  className,
}: {
  lat: number;
  lng: number;
  zoom?: number;
  height?: number;
  className?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+1B3A4B(${lng},${lat})/${lng},${lat},${zoom}/800x${height}@2x?access_token=${token}`;
    return (
      <div className={className} style={{ height }}>
        <img
          src={url}
          alt="Map"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <svg viewBox="0 0 400 160" className="w-full h-full rounded-2xl">
        <rect width="400" height="160" fill="#F5F3EF" />
        <path d="M0 120 Q100 90 200 100 T400 110 L400 160 L0 160 Z" fill="#FAFAF7" />
        <path d="M0 80 L400 60" stroke="#ECEAE4" strokeWidth="1" />
        <path d="M100 0 L140 160" stroke="#ECEAE4" strokeWidth="1" />
        <path d="M260 0 L280 160" stroke="#ECEAE4" strokeWidth="1" />
        <circle cx="200" cy="80" r="20" fill="#1B3A4B" opacity="0.15" />
        <circle cx="200" cy="80" r="6" fill="#1B3A4B" />
      </svg>
    </div>
  );
}

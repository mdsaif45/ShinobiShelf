import { useEffect, useMemo, useState } from 'react';

interface AvatarEntry {
  category: string;
  label: string;
  src: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  reading: 'Reading',
  letters: 'Letters',
  abstract: 'Abstract',
};

interface AvatarPickerProps {
  value: string;
  onChange: (src: string) => void;
}

/**
 * Grid picker over the locally generated avatar set in /public/avatars.
 * The manifest is fetched once so adding new avatars needs no code change:
 * re-run `node scripts/generate-avatars.mjs` and they appear here.
 */
export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [avatars, setAvatars] = useState<AvatarEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('reading');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/avatars/index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: AvatarEntry[]) => {
        if (!active) return;
        setAvatars(data);
        if (data.length && !data.some((a) => a.category === 'reading')) {
          setActiveCategory(data[0].category);
        }
      })
      .catch((err) => {
        console.warn('Could not load avatar manifest:', err);
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(avatars.map((a) => a.category))],
    [avatars]
  );

  const visible = useMemo(
    () => avatars.filter((a) => a.category === activeCategory),
    [avatars, activeCategory]
  );

  if (loadError) {
    return (
      <p className="text-[11px] text-gray-500">
        Avatar set unavailable. Run <code>node scripts/generate-avatars.mjs</code> to create it.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              activeCategory === cat
                ? 'bg-[#4B5320] text-white'
                : 'bg-[#F0EEEB] text-gray-600 hover:bg-[#E5E0D8]'
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-2 max-h-44 overflow-y-auto p-1">
        {visible.map((a) => {
          const isSelected = value === a.src;
          return (
            <button
              key={a.src}
              type="button"
              onClick={() => onChange(a.src)}
              title={a.label}
              aria-label={a.label}
              aria-pressed={isSelected}
              className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-[#4B5320] scale-110 shadow-sm'
                  : 'border-transparent opacity-85 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img src={a.src} alt={a.label} className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

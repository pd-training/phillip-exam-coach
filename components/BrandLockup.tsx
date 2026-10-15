import Link from 'next/link';

type Props = {
  href: string;
  variant?: 'light' | 'dark';
};

// Company lockup used in the navigation bars. "light" is for dark blue backgrounds,
// "dark" is for white navigation bars.
export default function BrandLockup({ href, variant = 'dark' }: Props) {
  const isLight = variant === 'light';
  return (
    <Link href={href} className="flex items-center gap-4 group" aria-label="PhillipCapital home">
      <div className="flex flex-col leading-none">
        <span className={`font-bold text-base tracking-tight ${isLight ? 'text-white' : 'text-blue-900'}`}>
          PhillipCapital
        </span>
        <span className={`text-[10px] mt-1 ${isLight ? 'text-blue-200' : 'text-gray-500'}`}>
          Your Partner in Finance
        </span>
      </div>
      <span className={`h-7 w-px ${isLight ? 'bg-blue-400/50' : 'bg-gray-300'}`} aria-hidden="true" />
      <span className={`text-sm font-semibold ${isLight ? 'text-blue-100' : 'text-gray-900'}`}>
        Phillip<span className={isLight ? 'text-amber-400' : 'text-amber-600'}>WealthAdvisory</span>
      </span>
    </Link>
  );
}

import { fondo, logo } from '../assets/index.js';

export default function AuthSplitLayout({
  children,
  logoClassName = 'h-28 w-auto sm:h-32 lg:h-44 xl:h-52',
}) {
  return (
    <div className="relative min-h-screen bg-cream text-text">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${fondo})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-cream/95 via-cream/85 to-cream/70" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-2 lg:gap-10">
          <section className="flex items-center justify-center">
            <div className="flex w-full max-w-[440px] flex-col items-center justify-center rounded-[32px] border border-white/70 bg-white/70 px-6 py-10 text-center shadow-soft backdrop-blur-sm">
              <img className={logoClassName} src={logo} alt="Sena Food" />
            </div>
          </section>
          <section className="flex items-center justify-center">
            <div className="flex w-full max-w-[440px] flex-col items-center">
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

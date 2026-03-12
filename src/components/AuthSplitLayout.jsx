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
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 lg:h-screen lg:items-stretch lg:px-0 lg:py-0">
        <div className="grid w-full gap-6 lg:h-full lg:grid-cols-2 lg:gap-0">
          <section className="flex items-center justify-center">
            <img className={logoClassName} src={logo} alt="Sena Food" />
          </section>
          <section className="flex items-center justify-center lg:items-stretch">
            <div className="flex w-full flex-col items-center lg:h-full">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

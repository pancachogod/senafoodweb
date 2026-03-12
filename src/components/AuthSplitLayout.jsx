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
      <div className="absolute inset-0 bg-gradient-to-br from-cream/80 via-cream/55 to-cream/35" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-2 lg:gap-10">
          <section className="order-1 flex items-center justify-center lg:justify-start">
            <img className={logoClassName} src={logo} alt="Sena Food" />
          </section>
          <section className="order-2 flex items-center justify-center lg:justify-end">
            <div className="flex w-full flex-col items-center">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

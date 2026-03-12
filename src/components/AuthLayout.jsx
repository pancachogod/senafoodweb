import { logo, wood } from '../assets/index.js';

export default function AuthLayout({
  children,
  logoClassName = 'h-12 w-auto',
  headerClassName = 'pt-6',
  mainClassName = '',
  contentClassName = '',
  showHeader = true,
  backgroundImage,
}) {
  return (
    <div
      className={`flex min-h-screen flex-col bg-cream text-text ${
        backgroundImage ? 'bg-cover bg-center' : ''
      }`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {showHeader ? (
        <header className={`flex justify-center ${headerClassName}`}>
          <img className={logoClassName} src={logo} alt="Sena Food" />
        </header>
      ) : null}
      <main className={`flex flex-1 items-center justify-center px-4 pb-9 ${mainClassName}`}>
        <div className={`flex w-full max-w-[360px] flex-col items-center gap-2 ${contentClassName}`}>
          {children}
        </div>
      </main>
      <div
        className="h-[120px] w-full bg-cover bg-center sm:h-[140px]"
        style={{ backgroundImage: `url(${wood})` }}
      />
    </div>
  );
}

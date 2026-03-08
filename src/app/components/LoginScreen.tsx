import { useAuth0 } from '@auth0/auth0-react';

export function LoginScreen() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div 
      className="size-full flex items-center justify-center overflow-hidden relative px-6"
      style={{
        backgroundColor: '#e4d5b7',
        backgroundImage: 'url(https://www.toptal.com/designers/subtlepatterns/patterns/old_map.png)',
        backgroundSize: '400px 400px',
      }}
    >
      {/* Parchment overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(90, 70, 50, 0.08) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(80, 60, 40, 0.06) 0%, transparent 40%),
            radial-gradient(ellipse at 45% 85%, rgba(100, 80, 60, 0.05) 0%, transparent 35%),
            linear-gradient(180deg, 
              rgba(244, 232, 208, 0.5) 0%, 
              rgba(235, 224, 203, 0.3) 50%,
              rgba(244, 232, 208, 0.5) 100%
            )
          `
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="https://raw.githubusercontent.com/DzhanybekZakiriiaev/logo/refs/heads/main/logo.png" 
            alt="StoryDrift" 
            className="w-32 opacity-90"
            style={{ filter: 'sepia(0.1) contrast(1.1)' }}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 
            className="text-5xl mb-2"
            style={{ 
              fontFamily: "'Indie Flower', cursive",
              color: 'rgba(20, 15, 10, 0.85)',
              letterSpacing: '2px'
            }}
          >
            StoryDrift
          </h1>
          <p 
            className="text-xl"
            style={{ 
              fontFamily: "'Patrick Hand', cursive",
              color: 'rgba(30, 20, 15, 0.7)'
            }}
          >
            where dreams begin
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => loginWithRedirect({
              authorizationParams: { screen_hint: 'signup' },
              appState: { returnTo: '/' }
            })}
            className="w-full py-4 transition-all cursor-pointer hover:shadow-lg"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '22px',
              color: 'rgba(20, 15, 10, 0.8)',
              background: 'rgba(60, 50, 40, 0.08)',
              border: '1px solid rgba(30, 20, 15, 0.3)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(60, 50, 40, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(60, 50, 40, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(30, 20, 15, 0.3)';
            }}
          >
            enter
          </button>

          <button
            onClick={() => loginWithRedirect({ appState: { returnTo: '/' } })}
            className="w-full py-3.5 transition-all cursor-pointer hover:shadow-lg"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '18px',
              color: 'rgba(25, 20, 15, 0.75)',
              background: 'rgba(250, 245, 235, 0.35)',
              border: '1px solid rgba(40, 30, 20, 0.25)',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 250, 240, 0.45)';
              e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(250, 245, 235, 0.35)';
              e.currentTarget.style.borderColor = 'rgba(40, 30, 20, 0.25)';
            }}
          >
            continue with google
          </button>
        </div>

        {/* Footer */}
        <p 
          className="text-center mt-6"
          style={{
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '15px',
            color: 'rgba(40, 30, 20, 0.55)',
          }}
        >
          i solemnly swear i seek good dreams
        </p>
      </div>

      {/* Add fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Indie+Flower&display=swap" rel="stylesheet" />
    </div>
  );
}

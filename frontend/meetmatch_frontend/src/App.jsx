import { useMemo, useState } from 'react';
import InterestsSetup from './InterestsSetup';
import Login from './Login';
import Signup from './Signup';
import './App.css';

const steps = [
  { key: 'login', label: 'Log in' },
  { key: 'signup', label: 'Create account' },
  { key: 'interests', label: 'Pick interests' },
];

function App() {
  const [authView, setAuthView] = useState('login');
  const [signupUser, setSignupUser] = useState(null);

  const handleSignupSuccess = (user) => {
    setSignupUser(user);
    setAuthView('interests');
  };

  const handleInterestsComplete = () => {
    setSignupUser(null);
    setAuthView('login');
  };

  const currentStep = useMemo(() => {
    if (authView === 'signup') {
      return 2;
    }

    if (authView === 'interests') {
      return 3;
    }

    return 1;
  }, [authView]);

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--pink" />
      <div className="app-shell__glow app-shell__glow--purple" />

      <main className="app-layout">
        <section className="app-hero">
          <span className="app-badge">✨ MeetMatch</span>
          <h1>Find your people for every plan.</h1>
          <p>
            A softer, social-first experience inspired by modern matching apps —
            built for quick signups, clean forms, and interest-led discovery.
          </p>

          <div className="app-stats">
            <div className="stat-card">
              <strong>3 steps</strong>
              <span>From signup to profile setup</span>
            </div>
            <div className="stat-card">
              <strong>Top 3 vibes</strong>
              <span>Show what you care about most</span>
            </div>
            <div className="stat-card">
              <strong>Nearby ready</strong>
              <span>Built for real-world meetups</span>
            </div>
          </div>

          <div className="app-progress" aria-label="setup progress">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`progress-pill ${currentStep === index + 1 ? 'progress-pill--active' : ''}`}
              >
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="app-device">
          <div className="device-frame">
            <div className="device-topbar">
              <span>9:41</span>
              <div className="device-status">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="device-screen">
              {authView === 'login' && (
                <Login onSwitchToSignup={() => setAuthView('signup')} />
              )}

              {authView === 'signup' && (
                <Signup
                  onSwitchToLogin={() => setAuthView('login')}
                  onSignupSuccess={handleSignupSuccess}
                />
              )}

              {authView === 'interests' && (
                <InterestsSetup
                  user={signupUser}
                  onComplete={handleInterestsComplete}
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
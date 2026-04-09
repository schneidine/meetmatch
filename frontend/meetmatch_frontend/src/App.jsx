import { useState } from 'react';
import InterestsSetup from './InterestsSetup';
import Login from './Login';
import Signup from './Signup';

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

  return (
    <div>
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
        <InterestsSetup user={signupUser} onComplete={handleInterestsComplete} />
      )}
    </div>
  );
}

export default App;
import { useState } from 'react';
import './Login.css';

export default function Login({ onSwitchToSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        setMessage(data.message || 'Login successful');
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="auth-card login-box">
      <div className="auth-card__header">
        <span className="auth-card__eyebrow">Welcome back</span>
        <h2>Log in to your circle</h2>
        <p>
          Pick up where you left off and find your next favorite connection.
        </p>
      </div>

      <div className="auth-mini-panel">
        <span className="auth-mini-panel__label">Tonight&apos;s energy</span>
        <div className="auth-mini-panel__chips">
          <span>🎵 Live music</span>
          <span>☕ Coffee chats</span>
          <span>🎨 Art walks</span>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Username or email</span>
          <input
            type="text"
            className="username"
            placeholder="alex@example.com"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            className="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {message && <p className="status-banner status-banner--success">{message}</p>}
      {error && <p className="status-banner status-banner--error">{error}</p>}

      {onSwitchToSignup && (
        <div className="auth-card__footer">
          <span>New to MeetMatch?</span>
          <button type="button" className="text-button" onClick={onSwitchToSignup}>
            Create an account
          </button>
        </div>
      )}
    </div>
  );
}
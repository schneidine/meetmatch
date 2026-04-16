import { useState } from 'react';
import './Signup.css';

const initialForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  age: '',
  password: '',
  location: '',
};

const Signup = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    fetch('http://127.0.0.1:8000/api/signup/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        setMessage(data.message || 'Signup successful');
        if (onSignupSuccess) {
          onSignupSuccess(data.user);
        }
        setForm(initialForm);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="auth-card auth-card--wide signup-container">
      <div className="auth-card__header">
        <span className="auth-card__eyebrow">Create your profile</span>
        <h2>Start matching in minutes</h2>
        <p>
          Tell us who you are and we&apos;ll help people with similar interests
          find you.
        </p>
      </div>

      <div className="auth-mini-panel auth-mini-panel--soft">
        <span className="auth-mini-panel__label">Profile checklist</span>
        <div className="signup-checklist">
          <span>✅ Name</span>
          <span>✅ Location</span>
          <span>✅ Interests</span>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-field">
            <span>First name</span>
            <input
              type="text"
              name="first_name"
              placeholder="Alex"
              value={form.first_name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Last name</span>
            <input
              type="text"
              name="last_name"
              placeholder="Morgan"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <label className="form-field">
          <span>Username</span>
          <input
            type="text"
            name="username"
            placeholder="alexm"
            value={form.username}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="alex@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Age</span>
            <input
              type="number"
              name="age"
              placeholder="22"
              value={form.age}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <label className="form-field">
          <span>Location</span>
          <input
            type="text"
            name="location"
            placeholder="Orlando, FL"
            value={form.location}
            onChange={handleChange}
          />
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Continue to interests'}
        </button>
      </form>

      {message && <p className="status-banner status-banner--success">{message}</p>}
      {error && <p className="status-banner status-banner--error">{error}</p>}

      {onSwitchToLogin && (
        <div className="auth-card__footer">
          <span>Already have an account?</span>
          <button type="button" className="text-button" onClick={onSwitchToLogin}>
            Log in
          </button>
        </div>
      )}
    </div>
  );
};

export default Signup;
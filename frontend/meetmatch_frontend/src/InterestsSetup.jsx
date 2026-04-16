import { useEffect, useMemo, useState } from 'react';
import './InterestsSetup.css';

export default function InterestsSetup({ user, onComplete }) {
  const [interests, setInterests] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [topIds, setTopIds] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const topSet = useMemo(() => new Set(topIds), [topIds]);
  const firstName = user?.first_name || user?.username || 'there';

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/interests/')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load interests');
        }

        setInterests(data.interests || []);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const toggleSelected = (interestId) => {
    setMessage('');
    setError('');

    if (selectedSet.has(interestId)) {
      setSelectedIds((current) => current.filter((id) => id !== interestId));
      setTopIds((current) => current.filter((id) => id !== interestId));
      return;
    }

    setSelectedIds((current) => [...current, interestId]);
  };

  const toggleTop = (interestId) => {
    setMessage('');
    setError('');

    if (!selectedSet.has(interestId)) {
      setError('Select this interest first before adding it to your top 3.');
      return;
    }

    if (topSet.has(interestId)) {
      setTopIds((current) => current.filter((id) => id !== interestId));
      return;
    }

    if (topIds.length >= 3) {
      setError('You can only choose 3 top interests.');
      return;
    }

    setTopIds((current) => [...current, interestId]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!user?.id) {
      setError('Signup session not found. Please sign up again.');
      return;
    }

    if (selectedIds.length < 3) {
      setError('Please select at least 3 interests.');
      return;
    }

    if (topIds.length !== 3) {
      setError('Please select exactly 3 top interests.');
      return;
    }

    setIsSaving(true);

    fetch(`http://127.0.0.1:8000/api/users/${user.id}/interests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selected_interest_ids: selectedIds,
        top_interest_ids: topIds,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save interests');
        }

        setMessage('Interests saved! Redirecting you to log in...');
        window.setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 900);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (isLoading) {
    return <div className="interests-card">Loading interests...</div>;
  }

  return (
    <div className="interests-card interests-container">
      <div className="interests-card__header">
        <span className="auth-card__eyebrow">Almost done</span>
        <h2>Hi {firstName}, choose your vibe</h2>
        <p>
          Select at least 3 interests, then lock in the top 3 that describe you
          best.
        </p>
      </div>

      <div className="selection-summary">
        <div className="summary-box">
          <strong>{selectedIds.length}</strong>
          <span>selected</span>
        </div>
        <div className="summary-box">
          <strong>{topIds.length}/3</strong>
          <span>top picks</span>
        </div>
        <div className="summary-box">
          <strong>{interests.length}</strong>
          <span>available vibes</span>
        </div>
      </div>

      <form className="interests-form" onSubmit={handleSubmit}>
        <section className="interest-section">
          <div className="interest-section__title-row">
            <h3>Pick everything that fits</h3>
            <span className="interest-helper">Minimum: 3 interests</span>
          </div>

          <div className="interest-chip-grid">
            {interests.map((interest) => (
              <button
                key={interest.id}
                type="button"
                className={`interest-chip ${selectedSet.has(interest.id) ? 'interest-chip--selected' : ''}`}
                onClick={() => toggleSelected(interest.id)}
              >
                <span>{interest.name}</span>
                <small>
                  {selectedSet.has(interest.id) ? 'Selected' : 'Tap to add'}
                </small>
              </button>
            ))}
          </div>
        </section>

        <section className="interest-section">
          <div className="interest-section__title-row">
            <h3>Your top 3</h3>
            <span className="interest-helper">{topIds.length}/3 locked in</span>
          </div>

          <div className="interest-chip-grid interest-chip-grid--compact">
            {selectedIds.length === 0 ? (
              <p className="empty-state">Select interests above to unlock your top 3.</p>
            ) : (
              interests
                .filter((interest) => selectedSet.has(interest.id))
                .map((interest) => (
                  <button
                    key={`top-${interest.id}`}
                    type="button"
                    className={`interest-chip interest-chip--top ${topSet.has(interest.id) ? 'interest-chip--active' : ''}`}
                    onClick={() => toggleTop(interest.id)}
                  >
                    <span>{interest.name}</span>
                    <small>
                      {topSet.has(interest.id) ? 'Top pick' : 'Make top 3'}
                    </small>
                  </button>
                ))
            )}
          </div>
        </section>

        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving your profile...' : 'Finish setup'}
        </button>

        {message && <p className="status-banner status-banner--success">{message}</p>}
        {error && <p className="status-banner status-banner--error">{error}</p>}
      </form>
    </div>
  );
}
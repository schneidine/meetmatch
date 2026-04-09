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
      setError('Select this interest first before adding it to top 3.');
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

        setMessage('Interests saved! You can now log in.');
        if (onComplete) {
          onComplete();
        }
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (isLoading) {
    return <div className="interests-container">Loading interests...</div>;
  }

  return (
    <div className="interests-container">
      <form className="interests-form" onSubmit={handleSubmit}>
        <h2>Select Your Interests</h2>
        <p>Choose all interests that apply, then mark your top 3.</p>

        <div className="interests-grid">
          {interests.map((interest) => (
            <label key={interest.id} className="interest-item">
              <input
                type="checkbox"
                checked={selectedSet.has(interest.id)}
                onChange={() => toggleSelected(interest.id)}
              />
              <span>{interest.name}</span>
            </label>
          ))}
        </div>

        <h3>Top 3 Interests ({topIds.length}/3)</h3>
        <div className="interests-grid">
          {interests
            .filter((interest) => selectedSet.has(interest.id))
            .map((interest) => (
              <label key={`top-${interest.id}`} className="interest-item">
                <input
                  type="checkbox"
                  checked={topSet.has(interest.id)}
                  onChange={() => toggleTop(interest.id)}
                />
                <span>{interest.name}</span>
              </label>
            ))}
        </div>

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Interests'}
        </button>

        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}

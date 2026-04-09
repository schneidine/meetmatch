import { useState } from "react";
import './Login.css';

export default function Login({ onSwitchToSignup }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
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

    return(
        <div className="login-box">
            <form onSubmit={handleSubmit}>
                <div>
                    <input 
                        type="text" 
                        className="username"
                        placeholder="Username or Email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input 
                        type="password"
                        className="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
                {onSwitchToSignup && (
                    <p>
                        New to account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#4da3ff',
                                cursor: 'pointer',
                                padding: 0,
                                textDecoration: 'underline',
                            }}
                        >
                            Sign up
                        </button>
                    </p>
                )}
                {message && <p>{message}</p>}
                {error && <p>{error}</p>}
            </form>
        </div>
    );
}
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the MeetMatch landing experience', () => {
  render(<App />);

  expect(screen.getByText(/find your people for every plan/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
});

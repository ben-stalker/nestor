import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

describe('App', () => {
  it('renders Nestor splash heading', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Nestor' })).toBeInTheDocument();
  });

  it('renders tagline', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("Your family's home hub")).toBeInTheDocument();
  });
});

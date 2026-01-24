import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home', () => {
    it('renders correctly', () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        expect(screen.getByText(/find the perfect name together/i)).toBeInTheDocument();
        expect(screen.getByText(/start swiping/i)).toBeInTheDocument();
        expect(screen.getByText(/add names manually/i)).toBeInTheDocument();
    });
});

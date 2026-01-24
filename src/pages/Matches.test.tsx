import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Matches from './Matches';
import { API } from '../lib/api';

vi.mock('../lib/api', () => ({
    API: {
        getMatches: vi.fn(),
    },
}));

describe('Matches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (API.getMatches as any).mockReturnValue(new Promise(() => { }));
        render(<Matches />);
        expect(screen.getByText(/finding your matches/i)).toBeInTheDocument();
    });

    it('renders empty state when no matches', async () => {
        (API.getMatches as any).mockResolvedValue([]);
        render(<Matches />);
        await waitFor(() => {
            expect(screen.getByText(/no matches yet/i)).toBeInTheDocument();
        });
    });

    it('renders matches when data exists', async () => {
        const mockMatches = [
            {
                id: '1',
                name: 'Alice',
                gender: 'girl',
                createdBy: 'Bob',
            },
        ];
        (API.getMatches as any).mockResolvedValue(mockMatches);
        render(<Matches />);
        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.getByText('girl')).toBeInTheDocument();
        });
    });
});

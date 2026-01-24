import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import History from './History';
import { API } from '../lib/api';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/api', () => ({
    API: {
        getVotes: vi.fn(),
        vote: vi.fn(),
    },
}));

describe('History', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (API.getVotes as any).mockReturnValue(new Promise(() => { }));
        render(
            <MemoryRouter>
                <History />
            </MemoryRouter>
        );
        expect(screen.getByText(/loading history/i)).toBeInTheDocument();
    });

    it('renders empty state when no votes', async () => {
        (API.getVotes as any).mockResolvedValue([]);
        render(
            <MemoryRouter>
                <History />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/no votes yet/i)).toBeInTheDocument();
        });
    });

    it('renders votes when data exists', async () => {
        const mockVotes = [
            {
                nameId: '1',
                vote: 'like',
                name: 'Alice',
                gender: 'girl',
                createdAt: new Date().toISOString(),
            },
        ];
        (API.getVotes as any).mockResolvedValue(mockVotes);

        render(
            <MemoryRouter>
                <History />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });
    });

    it('optimistically updates vote', async () => {
        const mockVotes = [
            {
                nameId: '1',
                vote: 'like',
                name: 'Alice',
                gender: 'girl',
                createdAt: new Date().toISOString(),
            },
        ];
        (API.getVotes as any).mockResolvedValue(mockVotes);

        render(
            <MemoryRouter>
                <History />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });

        // We can verify the button exists or just look for the icon

        // A better selector would be based on class or icon, but let's try to query by parent row if possible or just assuming index
        // The buttons have icons. 
        // Dislike button has X icon.
        // Let's refine the test to be more specific if possible.

        // Actually the code has specific styles for active state.

        (API.vote as any).mockResolvedValue({});

        // Click dislike (first button in the group usually, let's verify render order in code)
        // Code: Dislike, Maybe, Like
        const buttons = screen.getAllByRole('button');
        // First button is likely 'dislike' based on code order

        fireEvent.click(buttons[0]);

        expect(API.vote).toHaveBeenCalledWith('1', 'dislike');
    });
});

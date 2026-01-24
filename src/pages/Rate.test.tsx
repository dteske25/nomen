import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Rate from './Rate';
import { API } from '../lib/api';

vi.mock('../lib/api', () => ({
    API: {
        getNames: vi.fn(),
        vote: vi.fn(),
        getAlternatives: vi.fn(),
        getSimilarVibes: vi.fn(),
        submitName: vi.fn(),
        seed: vi.fn(),
    },
}));

describe('Rate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (API.getNames as any).mockReturnValue(new Promise(() => { }));
        render(<Rate />);
        expect(screen.getByText(/loading names/i)).toBeInTheDocument();
    });

    it('renders empty state when no names', async () => {
        (API.getNames as any).mockResolvedValue([]);
        render(<Rate />);
        await waitFor(() => {
            expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
        });
    });

    it('renders card when names exist', async () => {
        const mockNames = [
            {
                id: '1',
                name: 'Alice',
                gender: 'girl',
            },
        ];
        (API.getNames as any).mockResolvedValue(mockNames);
        render(<Rate />);
        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });
    });

    it('handles vote', async () => {
        const mockNames = [
            {
                id: '1',
                name: 'Alice',
                gender: 'girl',
            },
        ];
        (API.getNames as any).mockResolvedValue(mockNames);
        (API.vote as any).mockResolvedValue({ status: 'ok' });

        render(<Rate />);
        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });

        const likeButton = screen.getAllByRole('button')[3]; // Assuming order based on render
        // 0: Spellings, 1: Similar Vibes, 2: Dislike, 3: Maybe, 4: Like
        // Let's use more specific queries if possible or comments in code suggest order.
        // Code order: spellings, similar vibes, dislike, maybe, like.
        // The buttons have icons, but aria-labels would be better.
        // However, I can search by icon/class or just assume order for now or use `rerender` with `aria-label` added if I could modify code, but I'm testing existing code.
        // Code has icons: X (dislike), Clock (maybe), Check (like).

        // We can just click the button that contains the check icon if we could query by icon. 
        // Button containing Check icon (like).

        // Simpler: get buttons in order.
        // Spellings, Similar Vibes -> in one container
        // Dislike, Maybe, Like -> in another container

        const buttons = screen.getAllByRole('button');
        // Order: Spellings, Similar Vibes, Dislike, Maybe, Like.
        const likeBtn = buttons[4];

        fireEvent.click(likeBtn);

        expect(API.vote).toHaveBeenCalledWith('1', 'like');
        // Should remove card (show empty state if it was the only one)
        await waitFor(() => {
            expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
        });
    });

    it('shows match overlay', async () => {

        const mockNames = [
            {
                id: '1',
                name: 'Alice',
                gender: 'girl',
            },
            {
                id: '2',
                name: 'Bob',
                gender: 'boy',
            },
        ];
        (API.getNames as any).mockResolvedValue(mockNames);
        (API.vote as any).mockResolvedValue({ status: 'ok', match: true });
        vi.spyOn(Math, 'random').mockReturnValue(0.99);

        render(<Rate />);
        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });

        const buttons = screen.getAllByRole('button');
        const likeBtn = buttons[4];
        fireEvent.click(likeBtn);

        await waitFor(() => {
            expect(screen.getByText(/it's a match/i)).toBeInTheDocument();
        });
    });
});

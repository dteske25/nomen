import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Submit from './Submit';
import { API } from '../lib/api';

vi.mock('../lib/api', () => ({
    API: {
        submitName: vi.fn(),
    },
}));

describe('Submit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form', () => {
        render(<Submit />);
        expect(screen.getByText(/add a new name/i)).toBeInTheDocument();
    });

    it('validates input', () => {
        render(<Submit />);
        const button = screen.getByRole('button', { name: /add name/i });
        fireEvent.click(button);
        expect(API.submitName).not.toHaveBeenCalled();
    });

    it('submits name', async () => {
        (API.submitName as any).mockResolvedValue({});
        render(<Submit />);

        const input = screen.getByPlaceholderText(/e.g. Avery/i);
        fireEvent.change(input, { target: { value: 'Zoe' } });

        const buttons = screen.getAllByRole('button');
        // Gender buttons (boy, girl, neutral) + Submit button
        // Let's assume neutral is default or select one
        // Code: default gender is 'neutral'

        // Select 'girl'
        const girlBtn = screen.getByText('girl');
        fireEvent.click(girlBtn);

        const submitBtn = screen.getByRole('button', { name: /add name/i });
        fireEvent.click(submitBtn);

        expect(screen.getByText(/saving/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(API.submitName).toHaveBeenCalledWith('Zoe', 'girl');
            expect(screen.getByText(/saved/i)).toBeInTheDocument();
        });
    });

    it('handles error', async () => {
        (API.submitName as any).mockRejectedValue(new Error('Failed'));
        render(<Submit />);

        const input = screen.getByPlaceholderText(/e.g. Avery/i);
        fireEvent.change(input, { target: { value: 'Zoe' } });
        const submitBtn = screen.getByRole('button', { name: /add name/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/error saving name/i)).toBeInTheDocument();
        });
    });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NamePrompt from './NamePrompt';

describe('NamePrompt', () => {
    it('does not render when not open', () => {
        render(<NamePrompt isOpen={false} onSave={() => { }} />);
        expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
    });

    it('renders when open', () => {
        render(<NamePrompt isOpen={true} onSave={() => { }} />);
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it('calls onSave with trimmed name when submitted', () => {
        const onSave = vi.fn();
        render(<NamePrompt isOpen={true} onSave={onSave} />);

        const input = screen.getByLabelText(/your name/i);
        fireEvent.change(input, { target: { value: '  John Doe  ' } });

        const button = screen.getByRole('button', { name: /continue/i });
        expect(button).toBeEnabled();

        fireEvent.click(button);

        expect(onSave).toHaveBeenCalledWith('John Doe');
    });

    it('disables submit button when input is empty', () => {
        render(<NamePrompt isOpen={true} onSave={() => { }} />);
        const button = screen.getByRole('button', { name: /continue/i });
        expect(button).toBeDisabled();
    });
});

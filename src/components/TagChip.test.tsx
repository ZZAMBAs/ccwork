import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagChip } from './TagChip';

describe('TagChip.click', () => {
  it('should not navigate or change screens when the user clicks the tag chip body', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(<TagChip tagName="React" onRemove={onRemove} />);
    await user.click(screen.getByText('React'));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});

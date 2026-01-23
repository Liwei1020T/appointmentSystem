import { render, screen } from '@testing-library/react';
import OrderTimeline from '@/components/OrderTimeline';

it('renders received status label', () => {
  render(
    <OrderTimeline
      currentStatus="received"
      createdAt={new Date().toISOString()}
    />
  );

  expect(screen.getByText('已收拍')).toBeInTheDocument();
});

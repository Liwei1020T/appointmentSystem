import { render, screen } from '@testing-library/react';
import OrderTimeline from '@/components/OrderTimeline';

describe('OrderTimeline', () => {
  it('renders timeline with pending status', () => {
    render(
      <OrderTimeline
        currentStatus="pending"
        createdAt={new Date().toISOString()}
      />
    );

    expect(screen.getByText('订单已创建')).toBeInTheDocument();
    expect(screen.getByText('穿线处理中')).toBeInTheDocument();
    expect(screen.getByText('已取拍')).toBeInTheDocument();
  });

  it('renders timeline when received (mapped to in_progress step)', () => {
    render(
      <OrderTimeline
        currentStatus="received"
        createdAt={new Date().toISOString()}
      />
    );

    // "received" status now shows under "穿线处理中" step with description "已收拍，待开始处理"
    expect(screen.getByText('穿线处理中')).toBeInTheDocument();
    expect(screen.getByText('已收拍，待开始处理')).toBeInTheDocument();
  });

  it('renders timeline when in_progress', () => {
    render(
      <OrderTimeline
        currentStatus="in_progress"
        createdAt={new Date().toISOString()}
      />
    );

    expect(screen.getByText('穿线处理中')).toBeInTheDocument();
    expect(screen.getByText('正在进行穿线服务')).toBeInTheDocument();
  });

  it('renders timeline when completed (mapped to in_progress completed)', () => {
    render(
      <OrderTimeline
        currentStatus="completed"
        createdAt={new Date().toISOString()}
      />
    );

    // "completed" status now shows as "穿线处理中" step completed
    expect(screen.getByText('穿线处理中')).toBeInTheDocument();
    expect(screen.getByText('穿线服务已完成')).toBeInTheDocument();
  });

  it('renders timeline when picked_up', () => {
    render(
      <OrderTimeline
        currentStatus="picked_up"
        createdAt={new Date().toISOString()}
      />
    );

    expect(screen.getByText('已取拍')).toBeInTheDocument();
    expect(screen.getByText('已完成取拍')).toBeInTheDocument();
  });

  it('renders cancelled timeline', () => {
    render(
      <OrderTimeline
        currentStatus="cancelled"
        createdAt={new Date().toISOString()}
      />
    );

    expect(screen.getByText('订单已创建')).toBeInTheDocument();
    expect(screen.getByText('订单已取消')).toBeInTheDocument();
  });
});

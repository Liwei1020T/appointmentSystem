import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: '测试标题',
    message: '测试消息',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('不渲染当 isOpen 为 false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('测试标题')).not.toBeInTheDocument();
  });

  it('渲染标题和消息', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('测试标题')).toBeInTheDocument();
    expect(screen.getByText('测试消息')).toBeInTheDocument();
  });

  it('点击确认按钮触发 onConfirm', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="确认操作" />);

    fireEvent.click(screen.getByText('确认操作'));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('点击取消按钮触发 onClose', () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="取消操作" />);

    fireEvent.click(screen.getByText('取消操作'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('加载状态下按钮显示加载文本', () => {
    render(<ConfirmDialog {...defaultProps} loading confirmLabel="确认" />);

    expect(screen.getByText('处理中...')).toBeInTheDocument();
  });

  it('渲染详情区域', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        details={<p data-testid="details">详细信息</p>}
      />
    );

    expect(screen.getByTestId('details')).toBeInTheDocument();
    expect(screen.getByText('详细信息')).toBeInTheDocument();
  });

  it('支持不同的 variant 样式', () => {
    const { rerender } = render(<ConfirmDialog {...defaultProps} variant="warning" />);

    // Warning variant renders without error
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} variant="danger" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} variant="info" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

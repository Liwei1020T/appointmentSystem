import React, { useEffect, useRef, useCallback } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  /** 是否激活 focus trap */
  active?: boolean;
  /** 关闭时恢复焦点的元素 */
  restoreFocus?: boolean;
}

/**
 * FocusTrap 组件
 * 将键盘焦点限制在子元素内，用于模态框、下拉菜单等
 *
 * @param children - 子元素
 * @param active - 是否激活 trap
 * @param restoreFocus - 关闭时是否恢复原焦点
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // 获取容器内所有可聚焦元素
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => el.offsetParent !== null); // 过滤隐藏元素
  }, []);

  // 处理 Tab 键导航
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || event.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      // Shift + Tab 时，从第一个元素跳到最后一个
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab 时，从最后一个元素跳到第一个
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [active, getFocusableElements]
  );

  // 激活时聚焦第一个可聚焦元素
  useEffect(() => {
    if (active) {
      // 保存当前焦点元素
      previousActiveElement.current = document.activeElement as HTMLElement;

      // 延迟聚焦以确保 DOM 已渲染
      const timer = setTimeout(() => {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [active, getFocusableElements]);

  // 关闭时恢复焦点
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  // 添加键盘事件监听
  useEffect(() => {
    if (active) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [active, handleKeyDown]);

  return (
    <div ref={containerRef} data-focus-trap={active ? 'active' : 'inactive'}>
      {children}
    </div>
  );
};

export default FocusTrap;

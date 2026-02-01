/**
 * Onboarding Tutorial Component
 *
 * 新用户引导教程，展示应用主要功能
 *
 * 功能：
 * - 步骤式引导
 * - 高亮目标元素
 * - 可跳过/完成
 * - 使用 localStorage 记录完成状态
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
}

interface OnboardingTutorialProps {
  steps: TutorialStep[];
  storageKey?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

const STORAGE_PREFIX = 'onboarding-completed-';

export default function OnboardingTutorial({
  steps,
  storageKey = 'default',
  onComplete,
  onSkip,
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const fullStorageKey = `${STORAGE_PREFIX}${storageKey}`;

  // Check if tutorial was already completed
  useEffect(() => {
    setMounted(true);
    const completed = localStorage.getItem(fullStorageKey);
    if (!completed && steps.length > 0) {
      // Delay showing to let page render
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [fullStorageKey, steps.length]);

  // Update target element position
  useEffect(() => {
    if (!isVisible || !mounted) return;

    const step = steps[currentStep];
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(step.targetSelector!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isVisible, mounted, currentStep, steps]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(fullStorageKey, 'true');
    setIsVisible(false);
    onComplete?.();
  }, [fullStorageKey, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(fullStorageKey, 'true');
    setIsVisible(false);
    onSkip?.();
  }, [fullStorageKey, onSkip]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  if (!mounted || !isVisible || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate tooltip position - ensures tooltip stays within viewport
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || step.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 280; // Approximate height
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate horizontal position (always centered on target, clamped to viewport)
    const centerX = targetRect.left + targetRect.width / 2;
    const left = Math.max(padding, Math.min(centerX - tooltipWidth / 2, viewportWidth - tooltipWidth - padding));

    // Determine vertical position based on available space
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;

    // Default: try to show below the target
    let preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center' = step.position || 'bottom';

    // If position is 'top' but not enough space above, switch to bottom
    if (preferredPosition === 'top' && spaceAbove < tooltipHeight + padding) {
      preferredPosition = spaceBelow > tooltipHeight + padding ? 'bottom' : 'center';
    }
    // If position is 'bottom' but not enough space below, switch to top or center
    if (preferredPosition === 'bottom' && spaceBelow < tooltipHeight + padding) {
      preferredPosition = spaceAbove > tooltipHeight + padding ? 'top' : 'center';
    }

    switch (preferredPosition) {
      case 'top':
        return {
          position: 'fixed',
          top: Math.max(padding, targetRect.top - tooltipHeight - padding),
          left,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: Math.min(targetRect.bottom + padding, viewportHeight - tooltipHeight - padding),
          left,
        };
      case 'left':
        return {
          position: 'fixed',
          top: Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - padding)),
          left: Math.max(padding, targetRect.left - tooltipWidth - padding),
        };
      case 'right':
        return {
          position: 'fixed',
          top: Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - padding)),
          left: Math.min(targetRect.right + padding, viewportWidth - tooltipWidth - padding),
        };
      default:
        // Fallback to center
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const content = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleSkip} />

      {/* Highlight target element */}
      {targetRect && (
        <div
          className="absolute border-2 border-accent rounded-lg shadow-glow-lg pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="bg-white rounded-2xl shadow-lg p-5 w-80 max-w-[calc(100vw-32px)] z-[10000]"
        style={getTooltipStyle()}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-ink transition-colors"
          aria-label="关闭引导"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentStep
                  ? 'w-6 bg-accent'
                  : index < currentStep
                  ? 'w-1.5 bg-accent/50'
                  : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {step.icon || (
              <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-text-primary">
              {step.title}
            </h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isFirstStep
                ? 'text-text-tertiary cursor-not-allowed'
                : 'text-text-secondary hover:bg-ink'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
          >
            {isLastStep ? (
              <>
                完成
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                下一步
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip link */}
        <div className="mt-3 text-center">
          <button
            onClick={handleSkip}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            跳过引导
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// Reset tutorial for testing
export function resetTutorial(storageKey: string = 'default') {
  localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
}

// Check if tutorial was completed
export function isTutorialCompleted(storageKey: string = 'default'): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`) === 'true';
}

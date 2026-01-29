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

  // Calculate tooltip position
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

    switch (step.position || 'bottom') {
      case 'top':
        return {
          position: 'fixed',
          bottom: window.innerHeight - targetRect.top + padding,
          left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
        };
      case 'left':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + padding,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          position: 'fixed',
          top: targetRect.bottom + padding,
          left: Math.max(padding, targetRect.left),
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
        className="bg-white dark:bg-dark-elevated rounded-2xl shadow-lg p-5 w-80 max-w-[calc(100vw-32px)]"
        style={getTooltipStyle()}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="关闭引导"
        >
          <X className="w-4 h-4 text-text-tertiary dark:text-gray-400" />
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
                  : 'w-1.5 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {step.icon || (
              <div className="w-10 h-10 bg-accent-soft dark:bg-gray-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-text-primary dark:text-gray-100">
              {step.title}
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
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
                ? 'text-text-tertiary dark:text-gray-600 cursor-not-allowed'
                : 'text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            className="text-xs text-text-tertiary dark:text-gray-500 hover:text-text-secondary dark:hover:text-gray-400"
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

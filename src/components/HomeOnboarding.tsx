/**
 * Home Page Onboarding Tutorial
 *
 * 首页引导教程，介绍应用主要功能
 */

'use client';

import React from 'react';
import OnboardingTutorial, { TutorialStep } from './OnboardingTutorial';
import { Calendar, Package, Star, Gift, User, HandMetal } from 'lucide-react';

const homePageSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到 LW String Studio!',
    description: '让我们快速了解一下这个应用的主要功能，帮助您更好地使用穿线预约服务。',
    position: 'center',
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-alt rounded-xl flex items-center justify-center">
        <HandMetal className="w-5 h-5 text-white" />
      </div>
    ),
  },
  {
    id: 'booking',
    title: '在线预约穿线',
    description: '点击"预约"按钮，选择您喜欢的球线，填写球拍信息，即可完成预约。支持多拍同时预约！',
    targetSelector: '[href="/booking"]',
    position: 'top',
    icon: (
      <div className="w-10 h-10 bg-accent-soft dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <Calendar className="w-5 h-5 text-accent" />
      </div>
    ),
  },
  {
    id: 'orders',
    title: '订单追踪',
    description: '在"订单"页面查看所有订单状态，从接单、穿线中到已完成，全程透明追踪。',
    targetSelector: '[href="/orders"]',
    position: 'top',
    icon: (
      <div className="w-10 h-10 bg-accent-soft dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <Package className="w-5 h-5 text-accent" />
      </div>
    ),
  },
  {
    id: 'reviews',
    title: '分享您的体验',
    description: '订单完成后，您可以对穿线服务进行评价。您的评价将帮助其他用户做出选择！',
    targetSelector: '[href="/reviews"]',
    position: 'top',
    icon: (
      <div className="w-10 h-10 bg-accent-soft dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <Star className="w-5 h-5 text-accent" />
      </div>
    ),
  },
  {
    id: 'profile',
    title: '个人中心',
    description: '在"我的"页面查看会员等级、积分余额、优惠券等。完成订单可获得积分，积分可兑换优惠！',
    targetSelector: '[href="/profile"]',
    position: 'top',
    icon: (
      <div className="w-10 h-10 bg-accent-soft dark:bg-gray-700 rounded-xl flex items-center justify-center">
        <User className="w-5 h-5 text-accent" />
      </div>
    ),
  },
  {
    id: 'first-order',
    title: '首单优惠',
    description: '新用户首单享受特别优惠！立即预约，体验专业穿线服务。感谢您选择 LW String Studio！',
    position: 'center',
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-warning to-danger rounded-xl flex items-center justify-center">
        <Gift className="w-5 h-5 text-white" />
      </div>
    ),
  },
];

export default function HomeOnboarding() {
  return (
    <OnboardingTutorial
      steps={homePageSteps}
      storageKey="home-tutorial"
      onComplete={() => {
        console.info('[Onboarding] Home tutorial completed');
      }}
    />
  );
}

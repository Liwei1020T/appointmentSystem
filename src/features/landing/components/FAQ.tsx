'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components';

const faqs = [
  {
    question: '为什么你们的价格比外面便宜这么多？',
    answer: '我们采用“线上预约 + 集中穿线”的模式，省去了昂贵的临街门店租金和闲置人工成本，因此能将这部分利润直接让利给客户，在保证顶级手艺的同时提供全城最低价。',
  },
  {
    question: '我需要注册账户才能预约吗？',
    answer: '是的。注册账户后，您可以查看历史订单、累积积分、使用优惠券，并且在订单状态更新时收到 SMS 短信通知，这些都需要基于您的账户信息。',
  },
  {
    question: '穿线完成后如何通知我？',
    answer: '当您的球拍穿线完成并准备好取件时，系统会自动发送 SMS 短信到您注册的手机号码，请留意查收。',
  },
  {
    question: '支持哪些支付方式？',
    answer: '目前系统仅支持 Touch \'n Go (TnG) 电子钱包扫码支付。在提交订单后，扫描系统生成的二维码即可完成付款。',
  },
  {
    question: '如何获得积分和使用优惠券？',
    answer: '每次完成订单消费都会自动累积积分。您可以在个人中心查看积分余额，并使用积分为未来的订单兑换优惠券。',
  },
  {
    question: '我想购买套餐，有什么好处？',
    answer: '购买套餐包通常比单次购买更优惠。套餐内的次数可以分次使用，非常适合经常需要穿线的球友。',
  },
];

export default function FAQ() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-24 bg-ink-elevated dark:bg-dark-elevated">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-text-primary dark:text-gray-100 mb-4"
          >
            常见问题
          </motion.h2>
          <p className="text-lg text-text-secondary dark:text-gray-400">
            解答您关于服务的疑问
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-border-subtle dark:border-gray-700 rounded-xl bg-ink dark:bg-dark overflow-hidden hover:border-accent/30 transition-colors"
            >
              <button
                onClick={() => toggleIndex(index)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                aria-expanded={activeIndex === index}
              >
                <span className={`text-lg font-medium transition-colors ${activeIndex === index ? 'text-accent' : 'text-text-primary dark:text-gray-100'}`}>
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-text-tertiary dark:text-gray-500" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="p-5 pt-0 text-text-secondary dark:text-gray-400 leading-relaxed border-t border-dashed border-border-subtle/50 dark:border-gray-700/50 mt-2">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-ink dark:bg-dark p-6 rounded-2xl border border-border-subtle dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-info/10 dark:bg-info/20 p-2 rounded-full text-info">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary dark:text-gray-100">还有其他问题？</h4>
              <p className="text-sm text-text-secondary dark:text-gray-400">注册账户后查看更多指引或联系我们</p>
            </div>
          </div>
          <Button 
            variant="secondary"
            onClick={() => router.push('/signup')}
            className="whitespace-nowrap"
          >
            去注册
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

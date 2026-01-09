'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import SpotlightCard from './SpotlightCard';

const reviews = [
  {
    name: '李先生',
    role: '羽毛球爱好者',
    content: 'SMS 通知真的很及时，再也不用盲目等待了。取拍时间一目了然！',
    rating: 5,
    tag: 'SMS通知'
  },
  {
    name: '张教练',
    role: '专业教练',
    content: '穿线师手法专业，拉力精准。积分还能兑换优惠券，对长期打球的很划算。',
    rating: 5,
    tag: '专业穿线'
  },
  {
    name: '校队成员 A',
    role: '大学生',
    content: '球线种类很多，价格透明。用了套餐之后省了不少钱。',
    rating: 4,
    tag: '套餐优惠'
  },
  {
    name: '王女士',
    role: '周末球友',
    content: '注册预约很流畅，支持 TnG 扫码支付非常方便。整个体验很好。',
    rating: 5,
    tag: '扫码支付'
  },
  {
    name: '陈先生',
    role: '资深球友',
    content: '订单历史功能很棒，可以查到我以前穿的磅数，方便调整手感。',
    rating: 5,
    tag: '历史记录'
  },
  {
    name: '林同学',
    role: '学生',
    content: '流程指引很清晰，不用白跑一趟，推荐大家使用。',
    rating: 4,
    tag: '流程便捷'
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function Reviews() {
  return (
    <section id="reviews" className="py-20 md:py-24 bg-ink-elevated border-t border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header & Summary */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-text-primary mb-4 font-display"
          >
            球友心声
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-secondary bg-ink inline-flex px-6 py-3 rounded-full border border-border-subtle shadow-sm"
          >
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-text-primary">4.8</span> 平均评分
            </div>
            <span className="text-border-subtle">|</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-accent">500+</span> 球友信赖
            </div>
            <span className="text-border-subtle">|</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              真实反馈
            </div>
          </motion.div>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="h-full"
            >
              {/* Wrapped in SpotlightCard */}
              <SpotlightCard className="h-full p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <div className="px-2 py-1 rounded bg-gray-100 text-[10px] font-medium text-text-secondary">
                    {review.tag}
                  </div>
                </div>

                {/* Content */}
                <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                  "{review.content}"
                </p>

                {/* Footer */}
                <div className="flex items-center mt-auto border-t border-border-subtle/50 pt-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs mr-3">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary text-sm">{review.name}</div>
                    <div className="text-xs text-text-tertiary">{review.role}</div>
                  </div>
                  <Quote className="w-4 h-4 text-gray-200 ml-auto" />
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

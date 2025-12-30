/**
 * JSON-LD 结构化数据组件
 * 
 * 为搜索引擎提供结构化数据，增强搜索结果展示
 * 支持 LocalBusiness 和 Service schema
 */

import React from 'react';

interface JsonLdProps {
    type?: 'LocalBusiness' | 'Service' | 'WebSite';
    data?: Record<string, unknown>;
}

/**
 * LocalBusiness 结构化数据
 * 用于 Google 搜索显示营业信息、评分等
 */
export const LocalBusinessJsonLd: React.FC = () => {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'LW String Studio',
        description: 'LW 穿线工作室',
        url: process.env.NEXTAUTH_URL || 'https://lwstringstudio.li-wei.net',
        logo: `${process.env.NEXTAUTH_URL || ''}/images/logo.png`,
        image: `${process.env.NEXTAUTH_URL || ''}/images/og-image.png`,
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'MY',
            addressLocality: 'Malaysia',
        },
        geo: {
            '@type': 'GeoCoordinates',
            // 添加你的实际坐标
            // latitude: 3.1390,
            // longitude: 101.6869,
        },
        priceRange: 'RM15-RM50',
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '09:00',
                closes: '21:00',
            },
        ],
        sameAs: [
            // 添加社交媒体链接
            // 'https://facebook.com/stringservice',
            // 'https://instagram.com/stringservice',
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '100',
            bestRating: '5',
            worstRating: '1',
        },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: '穿线服务',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: '羽毛球穿线服务',
                        description: '专业穿线师，多种球线选择',
                    },
                },
            ],
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
};

/**
 * WebSite 结构化数据
 * 用于 Google 搜索框显示
 */
export const WebSiteJsonLd: React.FC = () => {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'LW String Studio',
        url: process.env.NEXTAUTH_URL || 'https://lwstringstudio.li-wei.net',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${process.env.NEXTAUTH_URL || ''}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
};

/**
 * 通用 JSON-LD 包装组件
 */
export const JsonLd: React.FC<JsonLdProps> = ({ type = 'LocalBusiness', data }) => {
    if (type === 'LocalBusiness') {
        return <LocalBusinessJsonLd />;
    }
    if (type === 'WebSite') {
        return <WebSiteJsonLd />;
    }

    // 自定义数据
    if (data) {
        return (
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            />
        );
    }

    return null;
};

export default JsonLd;

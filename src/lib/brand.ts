/**
 * 品牌配置常量
 * 
 * 统一管理所有品牌相关文字，避免硬编码
 * 修改品牌名只需修改此文件
 */

export const BRAND = {
    // 主品牌名
    name: 'LW String Studio',

    // 中文辅助名
    nameCN: 'LW 穿线工作室',

    // 短名称（用于短信签名等）
    shortName: 'LW穿线',

    // PWA 短名称
    pwaShortName: 'LW String',

    // 品牌标语
    tagline: '专业穿线，用心服务',
    taglineEN: 'Professional Stringing, Crafted with Care',

    // 品牌描述
    description: '个人羽毛球穿线工作室，专注每一次穿线服务',
    descriptionEN: 'Personal badminton stringing studio',

    // 域名
    domain: 'lwstringstudio.li-wei.net',

    // 完整 URL
    get url() {
        return process.env.NEXTAUTH_URL || `https://${this.domain}`;
    },

    // 版权信息
    get copyright() {
        return `© ${new Date().getFullYear()} ${this.name}`;
    },

    // 短信签名
    get smsSignature() {
        return `【${this.shortName}】`;
    },

    // 邀请分享文案
    get inviteTitle() {
        return `邀请你体验 ${this.name}`;
    },

    get inviteTitleEN() {
        return `Join me at ${this.name}!`;
    },
} as const;

export default BRAND;

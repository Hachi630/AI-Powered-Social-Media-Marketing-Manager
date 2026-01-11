import {
    InstagramOutlined,
    FacebookFilled,
    TwitterOutlined,
    LinkedinFilled,
    GlobalOutlined
} from '@ant-design/icons';
import React from 'react';

export const PLATFORM_COLORS: Record<string, string> = {
    instagram_post: '#E1306C',
    instagram_story: '#F77737',
    instagram_reels: '#833AB4',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
};

interface PlatformIconProps {
    platform: string;
    style?: React.CSSProperties;
    className?: string;
}

export default function PlatformIcon({ platform, style, className }: PlatformIconProps) {
    const color = PLATFORM_COLORS[platform] || '#8c8c8c';
    const iconStyle = { color, ...style };

    switch (platform) {
        case 'instagram_post':
        case 'instagram_story':
        case 'instagram_reels':
            return <InstagramOutlined style={iconStyle} className={className} />;
        case 'facebook':
            return <FacebookFilled style={iconStyle} className={className} />;
        case 'twitter':
            // X logo is standard now but TwitterOutlined is the safe fallback in antd
            return <TwitterOutlined style={iconStyle} className={className} />;
        case 'linkedin':
            return <LinkedinFilled style={iconStyle} className={className} />;
        default:
            return <GlobalOutlined style={iconStyle} className={className} />;
    }
}

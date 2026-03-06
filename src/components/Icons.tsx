import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

// ⚽ Soccer Ball — for goals market
export const SoccerBall: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2C12 2 14.5 5.5 14.5 8C14.5 10.5 12 12 12 12C12 12 9.5 10.5 9.5 8C9.5 5.5 12 2 12 2Z" fill="currentColor" opacity="0.3" />
        <path d="M12 12L7 17M12 12L17 17M12 12V7M12 12L5.5 9M12 12L18.5 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    </svg>
);

// 🚩 Corner Flag — for corners market  
export const CornerFlag: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M5 22V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 4C5 4 7 3 10 4C13 5 15 4 17 3V12C17 12 15 13 12 12C9 11 7 12 5 13" fill="currentColor" opacity="0.2" />
        <path d="M5 4C5 4 7 3 10 4C13 5 15 4 17 3V12C17 12 15 13 12 12C9 11 7 12 5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 22H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// 🃏 Yellow Card — for cards market
export const YellowCard: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="2" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
        <rect x="6" y="2" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M10 8H14M10 11H14M10 14H12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
);

// 📊 Analytics Chart — for probabilities  
export const AnalyticsChart: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M3 20H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="5" y="12" width="3" height="8" rx="1" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1" />
        <rect x="10.5" y="6" width="3" height="14" rx="1" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1" />
        <rect x="16" y="9" width="3" height="11" rx="1" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1" />
        <path d="M6.5 10L12 4L17.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6.5" cy="10" r="1.5" fill="currentColor" />
        <circle cx="12" cy="4" r="1.5" fill="currentColor" />
        <circle cx="17.5" cy="7" r="1.5" fill="currentColor" />
    </svg>
);

// 🧠 Brain — for smart tips & insights
export const BrainInsight: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8 2 5 5 5 8.5C5 10.5 6 12 7 13L8 19H16L17 13C18 12 19 10.5 19 8.5C19 5 16 2 12 2Z" fill="currentColor" opacity="0.12" />
        <path d="M9.5 5C8 5.5 7 7 7 8.5C7 10 8 11.5 9 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14.5 5C16 5.5 17 7 17 8.5C17 10 16 11.5 15 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 2V5M12 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 12.5L8.5 18.5H15.5L15 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 18.5V21M14 18.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="8" r="1" fill="currentColor" />
        <circle cx="14" cy="8" r="1" fill="currentColor" />
    </svg>
);

// ⚡ Lightning Bolt — for opportunities (refined, not cliché shape)
export const LightningBolt: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L4 14H11L10 22L20 10H13L13 2Z" fill="currentColor" opacity="0.15" />
        <path d="M13 2L4 14H11L10 22L20 10H13L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 🔗 Share/Export icon
export const ShareIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3V15M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 14V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 📡 Live Pulse — for live matches
export const LivePulse: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        <path d="M2 12H6M18 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <path d="M12 2V6M12 18V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
);

// 🎯 Crosshair — for accuracy / match result
export const Crosshair: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// 🏆 Trophy — for confidence/win
export const Trophy: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2H16V9C16 11.2 14.2 13 12 13C9.8 13 8 11.2 8 9V2Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4H5C4.4 4 4 4.4 4 5V6C4 7.7 5.3 9 7 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 4H19C19.6 4 20 4.4 20 5V6C20 7.7 18.7 9 17 9H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 13V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 21H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 16H14V18C14 19.1 13.1 20 12 20C10.9 20 10 19.1 10 18V16Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// 🔄 Sync icon — for real-time updates
export const SyncIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12C21 16.97 16.97 21 12 21C9 21 6.38 19.55 4.75 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 12C3 7.03 7.03 3 12 3C15 3 17.62 4.45 19.25 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19.25 2.75V6.75H15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.75 21.25V17.25H8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 📅 Calendar — for date picker
export const CalendarIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 2V5M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="7" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.2" />
        <rect x="14" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="7" y="17" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.15" />
    </svg>
);

// ◀ Chevron Left
export const ChevronLeft: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ▶ Chevron Right
export const ChevronRight: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ▼ Chevron Down
export const ChevronDown: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 🏟️ Stadium — for leagues / venues  
export const Stadium: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12" cy="16" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.08" />
        <path d="M3 16V10C3 10 7 7 12 7C17 7 21 10 21 10V16" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 8V4M17 8V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 4H17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
        <path d="M12 7V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// 📈 Trend Up — for 1X2  
export const TrendUp: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7H21V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.08" />
    </svg>
);

// ⏱ Timer / Clock
export const TimerIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 9V13L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// 🔒 Shield — for safe bets  
export const ShieldIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16 7.5 20.5 12 22C16.5 20.5 20 16 20 11V6L12 2Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ⚖ Balance/Scale — for balanced bets
export const BalanceScale: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 7L12 5L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 13L5 7L7 13C7 14.5 5 16 5 16C5 16 3 14.5 3 13Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M17 13L19 7L21 13C21 14.5 19 16 19 16C19 16 17 14.5 17 13Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 21H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="5" r="1" fill="currentColor" />
    </svg>
);

// 🔥 Fire — for bold bets
export const FireIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C12 2 8 6 8 10C8 12 9 14 10 15C9 13 9.5 11 12 9C14.5 11 15 13 14 15C15 14 16 12 16 10C16 6 12 2 12 2Z" fill="currentColor" opacity="0.15" />
        <path d="M12 2C12 2 8 6 8 10C8 14 10 16 10 16C10 16 9 12 12 9C15 12 14 16 14 16C14 16 16 14 16 10C16 6 12 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 18C10 18 10 16 12 15C14 16 14 18 14 18C14 20 12 22 12 22C12 22 10 20 10 18Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);

// 📋 Stack/Layers — for bet builder
export const StackLayers: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
);

// ⭐ Star — for confidence rating
export const StarIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.5L5.8 21L7.2 14L2 9.3L9.1 8.6L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);

// ⏳ Loader/Spinner
export const SpinnerIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`animate-spin ${className || ''}`} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.15" />
        <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// ⚠ Warning Circle
export const WarningCircle: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
);

// 🏠 Home — for home team advantage
export const HomeTeam: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10L12 3L21 10V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 21V14H15V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ✈ Away — for away team
export const AwayTeam: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L2 9L10 12L13 22L22 2Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M22 2L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

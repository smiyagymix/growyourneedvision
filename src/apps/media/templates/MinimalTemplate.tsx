import React from 'react';
import { useCurrentFrame, useVideoConfig, Img, Video } from 'remotion';
import { MinimalProps } from './types';
import { SafeAudio } from '../components/SafeAudio';

export const MinimalTemplate: React.FC<MinimalProps> = ({
    title,
    subtitle,
    primaryColor,
    backgroundColor,
    logoUrl,
    backgroundImageUrl,
    backgroundVideoUrl,
    accentPosition,
    audioUrl,
    audioVolume,
    audioStartFrom,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Ultra-smooth fade in
    const opacity = Math.min(1, frame / 40);

    // Subtle scale
    const scale = 0.95 + Math.min(0.05, (frame / 60) * 0.05);

    // Accent animation based on position
    const accentOpacity = 0.3 + Math.sin(frame / 30) * 0.1;

    const getAccentStyle = (): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}40, transparent)`,
            opacity: accentOpacity,
        };

        switch (accentPosition) {
            case 'top':
                return { ...baseStyle, top: -150, left: '50%', transform: 'translateX(-50%)' };
            case 'bottom':
                return { ...baseStyle, bottom: -150, left: '50%', transform: 'translateX(-50%)' };
            case 'center':
            default:
                return { ...baseStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: backgroundColor || '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            {/* Background Media */}
            {backgroundVideoUrl && (
                <Video
                    src={backgroundVideoUrl}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.1,
                    }}
                />
            )}
            {backgroundImageUrl && !backgroundVideoUrl && (
                <Img
                    src={backgroundImageUrl}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.1,
                    }}
                />
            )}

            {/* Accent Circle */}
            <div style={getAccentStyle()} />

            {/* Main Content */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${scale})`,
                textAlign: 'center',
                width: '70%',
                opacity,
            }}>
                <h1 style={{
                    color: '#1f2937',
                    fontSize: 110,
                    fontWeight: '200',
                    marginBottom: 20,
                    letterSpacing: '-4px',
                    lineHeight: 1,
                }}>
                    {title}
                </h1>
                <div style={{
                    width: 60,
                    height: 2,
                    background: primaryColor,
                    margin: '40px auto',
                }} />
                <h2 style={{
                    color: '#6b7280',
                    fontSize: 36,
                    fontWeight: '300',
                    letterSpacing: '4px',
                }}>
                    {subtitle}
                </h2>
            </div>

            {/* Minimal Logo Placement */}
            {logoUrl && (
                <Img
                    src={logoUrl}
                    style={{
                        position: 'absolute',
                        top: 60,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        maxWidth: 100,
                        maxHeight: 100,
                        objectFit: 'contain',
                        opacity: opacity * 0.8,
                    }}
                />
            )}

            {/* Subtle Corner Accent */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                right: 40,
                width: 60,
                height: 60,
                border: `2px solid ${primaryColor}`,
                opacity: opacity * 0.4,
            }} />

            {/* Audio Track with Volume and Start Control */}
            {audioUrl && (
                <SafeAudio
                    src={audioUrl}
                    volume={(frame) => {
                        // Apply volume with smooth fade in
                        const fadeInDuration = 10;
                        const fadeMultiplier = Math.min(1, frame / fadeInDuration);
                        return audioVolume * fadeMultiplier;
                    }}
                    startFrom={audioStartFrom}
                />
            )}
        </div>
    );
};

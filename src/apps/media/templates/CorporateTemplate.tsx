import React from 'react';
import { useCurrentFrame, useVideoConfig, Img, Video } from 'remotion';
import { CorporateProps } from './types';
import { SafeAudio } from '../components/SafeAudio';

export const CorporateTemplate: React.FC<CorporateProps> = ({
    title,
    subtitle,
    primaryColor,
    backgroundColor,
    logoUrl,
    backgroundImageUrl,
    backgroundVideoUrl,
    companyName,
    tagline,
    audioUrl,
    audioVolume,
    audioStartFrom,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Smooth fade in
    const opacity = Math.min(1, frame / 30);

    // Elegant slide from left
    const slideX = Math.max(0, 150 - (frame * 4));

    // Pulse effect for accent
    const pulse = 1 + Math.sin(frame / 20) * 0.03;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: backgroundColor || '#0f172a',
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
                        opacity: 0.15,
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
                        opacity: 0.15,
                    }}
                />
            )}

            {/* Geometric Background Pattern */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0.05,
                background: `repeating-linear-gradient(
                    45deg,
                    ${primaryColor},
                    ${primaryColor} 2px,
                    transparent 2px,
                    transparent 20px
                )`,
            }} />

            {/* Accent Bar */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: '40%',
                bottom: '40%',
                width: 12,
                background: primaryColor,
                transform: `scaleY(${pulse})`,
                boxShadow: `0 0 30px ${primaryColor}`,
            }} />

            {/* Main Content */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translateX(-${slideX}px)`,
                textAlign: 'center',
                width: '80%',
                opacity,
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: 95,
                    fontWeight: '900',
                    marginBottom: 40,
                    textShadow: `0 2px 40px rgba(0,0,0,0.8)`,
                    letterSpacing: '-3px',
                    lineHeight: 1.1,
                }}>
                    {title}
                </h1>
                <h2 style={{
                    color: '#94a3b8',
                    fontSize: 42,
                    fontWeight: '300',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                }}>
                    {subtitle}
                </h2>
            </div>

            {/* Company Name */}
            <div style={{
                position: 'absolute',
                top: 50,
                left: 80,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                opacity,
            }}>
                {logoUrl && (
                    <Img
                        src={logoUrl}
                        style={{
                            maxWidth: 80,
                            maxHeight: 60,
                            objectFit: 'contain',
                        }}
                    />
                )}
                <div style={{
                    color: 'white',
                    fontSize: 32,
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                }}>
                    {companyName}
                </div>
            </div>

            {/* Tagline */}
            {tagline && (
                <div style={{
                    position: 'absolute',
                    bottom: 60,
                    left: 80,
                    right: 80,
                    textAlign: 'center',
                    color: primaryColor,
                    fontSize: 24,
                    fontWeight: '500',
                    letterSpacing: '2px',
                    opacity,
                }}>
                    {tagline}
                </div>
            )}

            {/* Professional Footer */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                opacity: opacity * 0.6,
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

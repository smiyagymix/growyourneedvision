import React from 'react';
import { useCurrentFrame, useVideoConfig, Img, Video } from 'remotion';
import { EducationalProps } from './types';
import { SafeAudio } from '../components/SafeAudio';

export const EducationalTemplate: React.FC<EducationalProps> = ({
    title,
    subtitle,
    primaryColor,
    backgroundColor,
    logoUrl,
    backgroundImageUrl,
    backgroundVideoUrl,
    lessonNumber,
    subject,
    audioUrl,
    audioVolume,
    audioStartFrom,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Smooth fade in animation
    const opacity = Math.min(1, frame / 30);

    // Scale animation with easing
    const scale = Math.min(1, 0.5 + (frame / 40));

    // Slide in from bottom
    const slideY = Math.max(0, 100 - (frame * 3));

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: backgroundColor || '#1e3a8a',
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
                        opacity: 0.3,
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
                        opacity: 0.3,
                    }}
                />
            )}

            {/* Decorative Elements */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 8,
                background: `linear-gradient(90deg, ${primaryColor}, #fbbf24, ${primaryColor})`,
            }} />

            {/* Subject Badge */}
            <div style={{
                position: 'absolute',
                top: 40,
                left: 40,
                background: primaryColor,
                color: 'white',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 'bold',
                opacity,
                textTransform: 'uppercase',
                letterSpacing: '2px',
            }}>
                {subject}
            </div>

            {/* Lesson Number */}
            {lessonNumber && (
                <div style={{
                    position: 'absolute',
                    top: 40,
                    right: 40,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 'bold',
                    opacity,
                }}>
                    Lesson {lessonNumber}
                </div>
            )}

            {/* Main Content */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translateY(${slideY}px) scale(${scale})`,
                textAlign: 'center',
                width: '80%',
                opacity,
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: 90,
                    fontWeight: 'bold',
                    marginBottom: 30,
                    textShadow: `0 4px 20px rgba(0,0,0,0.5)`,
                    lineHeight: 1.2,
                }}>
                    {title}
                </h1>
                <div style={{
                    width: 200,
                    height: 4,
                    background: primaryColor,
                    margin: '0 auto 30px',
                }} />
                <h2 style={{
                    color: '#e0e7ff',
                    fontSize: 40,
                    fontWeight: '300',
                    letterSpacing: '1px',
                }}>
                    {subtitle}
                </h2>
            </div>

            {/* Logo */}
            {logoUrl && (
                <Img
                    src={logoUrl}
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        left: 40,
                        maxWidth: 120,
                        maxHeight: 80,
                        objectFit: 'contain',
                        opacity,
                    }}
                />
            )}

            {/* Branding */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                right: 40,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 20,
                fontWeight: '500',
                opacity,
            }}>
                Grow Your Need
            </div>

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

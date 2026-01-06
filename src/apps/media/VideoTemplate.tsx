import { Composition, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

interface VideoProps {
    title: string;
    subtitle: string;
    primaryColor?: string;
}

export const MyVideo: React.FC<VideoProps> = ({ title, subtitle, primaryColor = '#3b82f6' }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Smooth fade in animation
    const opacity = Math.min(1, frame / 30);

    // Scale animation with easing
    const scale = Math.min(1, 0.5 + (frame / 40));

    // Rotation effect for background elements
    const rotation = (frame / fps) * 30;

    // Pulse effect for title
    const pulse = 1 + Math.sin(frame / 15) * 0.05;

    return (
        <div style={{
            flex: 1,
            backgroundColor: '#0f172a',
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                width: 500,
                height: 500,
                background: `radial-gradient(circle, ${primaryColor}33, transparent)`,
                borderRadius: '50%',
                top: '20%',
                left: '10%',
                transform: `rotate(${rotation}deg)`,
                opacity: 0.3
            }} />

            <div style={{
                position: 'absolute',
                width: 400,
                height: 400,
                background: `radial-gradient(circle, ${primaryColor}22, transparent)`,
                borderRadius: '50%',
                bottom: '10%',
                right: '15%',
                transform: `rotate(${-rotation}deg)`,
                opacity: 0.2
            }} />

            {/* Main content */}
            <div style={{
                opacity,
                transform: `scale(${scale})`,
                textAlign: 'center',
                zIndex: 10,
                padding: '0 40px'
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: 100,
                    fontWeight: 'bold',
                    marginBottom: 20,
                    textShadow: `0 0 40px ${primaryColor}, 0 0 80px ${primaryColor}66`,
                    transform: `scale(${pulse})`,
                    letterSpacing: '-2px'
                }}>
                    {title}
                </h1>
                <h2 style={{
                    color: '#94a3b8',
                    fontSize: 50,
                    fontWeight: '300',
                    letterSpacing: '2px'
                }}>
                    {subtitle}
                </h2>
            </div>

            {/* Bottom branding */}
            <div style={{
                position: 'absolute',
                bottom: 50,
                right: 50,
                color: primaryColor,
                fontSize: 28,
                fontWeight: 'bold',
                opacity: opacity,
                display: 'flex',
                alignItems: 'center',
                gap: 10
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 20
                }}>
                    GYN
                </div>
                Grow Your Need
            </div>
        </div>
    );
};

export const VideoComposition: React.FC = () => {
    return (
        <Composition<VideoProps>
            id="PromoVideo"
            component={MyVideo}
            durationInFrames={150}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{
                title: "Welcome to the Platform",
                subtitle: "Create. Learn. Grow.",
                primaryColor: "#3b82f6"
            }}
        />
    );
};

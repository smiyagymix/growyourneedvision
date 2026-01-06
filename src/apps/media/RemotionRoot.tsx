import React from 'react';
import { Composition } from 'remotion';
import { EducationalTemplate } from './templates/EducationalTemplate';
import { CorporateTemplate } from './templates/CorporateTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { EducationalProps, CorporateProps, MinimalProps } from './templates/types';

// Register all video compositions
export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="Educational"
                component={EducationalTemplate}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{
                    title: 'Lesson Title',
                    subtitle: 'Introduction',
                    primaryColor: '#3b82f6',
                    backgroundColor: '#1e3a8a',
                    logoUrl: null,
                    backgroundImageUrl: null,
                    backgroundVideoUrl: null,
                    lessonNumber: '1',
                    subject: 'Mathematics',
                    audioUrl: null,
                    audioVolume: 0.5,
                    audioStartFrom: 0,
                } as EducationalProps}
            />

            <Composition
                id="Corporate"
                component={CorporateTemplate}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{
                    title: 'Your Message',
                    subtitle: 'Professional Presentation',
                    primaryColor: '#059669',
                    backgroundColor: '#0f172a',
                    logoUrl: null,
                    backgroundImageUrl: null,
                    backgroundVideoUrl: null,
                    companyName: 'Company Name',
                    tagline: 'Excellence in Innovation',
                    audioUrl: null,
                    audioVolume: 0.5,
                    audioStartFrom: 0,
                } as CorporateProps}
            />

            <Composition
                id="Minimal"
                component={MinimalTemplate}
                durationInFrames={150}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{
                    title: 'Clean Design',
                    subtitle: 'Simple and Elegant',
                    primaryColor: '#8b5cf6',
                    backgroundColor: '#ffffff',
                    logoUrl: null,
                    backgroundImageUrl: null,
                    backgroundVideoUrl: null,
                    accentPosition: 'center' as const,
                    audioUrl: null,
                    audioVolume: 0.5,
                    audioStartFrom: 0,
                } as MinimalProps}
            />
        </>
    );
};

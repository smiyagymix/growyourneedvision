import React from 'react';
import { AbsoluteFill, Sequence, Video, Img, Audio } from 'remotion';
import { VideoProject } from '../types';

export const ProjectComposition: React.FC<{ project: VideoProject }> = ({ project }) => {
    return (
        <AbsoluteFill style={{ backgroundColor: project.backgroundColor }}>
            {project.tracks.map(track => {
                if (track.isHidden) return null;
                
                return (
                    <AbsoluteFill key={track.id}>
                        {track.clips.map(clip => (
                            <Sequence
                                key={clip.id}
                                from={clip.startFrame}
                                durationInFrames={clip.durationInFrames}
                            >
                                {clip.type === 'video' && <Video src={clip.content} style={{ width: '100%', height: '100%', ...clip.props.style }} />}
                                {clip.type === 'image' && <Img src={clip.content} style={{ width: '100%', height: '100%', ...clip.props.style }} />}
                                {clip.type === 'text' && (
                                    <div style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center',
                                        fontSize: '40px',
                                        color: 'white',
                                        ...clip.props.style 
                                    }}>
                                        {clip.content}
                                    </div>
                                )}
                                {clip.type === 'audio' && !track.isMuted && <Audio src={clip.content} />}
                            </Sequence>
                        ))}
                    </AbsoluteFill>
                );
            })}
        </AbsoluteFill>
    );
};

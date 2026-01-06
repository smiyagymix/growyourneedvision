declare module '@remotion/player' {
    import React from 'react';
    
    export interface PlayerProps<T = Record<string, unknown>> {
        component: React.ComponentType<T>;
        durationInFrames: number;
        compositionWidth: number;
        compositionHeight: number;
        fps: number;
        controls?: boolean;
        autoPlay?: boolean;
        loop?: boolean;
        inputProps?: T;
        style?: React.CSSProperties;
        className?: string;
    }

    export const Player: <T>(props: PlayerProps<T>) => React.ReactElement;
}

declare module 'remotion' {
    import React from 'react';

    export interface CompositionProps<T> {
        id: string;
        component: React.ComponentType<T>;
        durationInFrames: number;
        fps: number;
        width: number;
        height: number;
        defaultProps?: T;
    }

    export const Composition: <T>(props: CompositionProps<T>) => React.ReactElement;
    
    export interface VideoConfig {
        width: number;
        height: number;
        fps: number;
        durationInFrames: number;
        id: string;
    }

    export const useCurrentFrame: () => number;
    export const useVideoConfig: () => VideoConfig;

    export const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
    export const Video: React.FC<React.VideoHTMLAttributes<HTMLVideoElement>>;
    export const Audio: React.FC<React.AudioHTMLAttributes<HTMLAudioElement>>;
}

declare module '@aws-sdk/client-s3' {
    export interface S3ClientConfig {
        region: string;
        credentials: {
            accessKeyId: string;
            secretAccessKey: string;
        };
        endpoint?: string;
        forcePathStyle?: boolean;
    }

    export class S3Client {
        constructor(config: S3ClientConfig);
        send<TInput extends object, TOutput extends object>(command: Command<TInput, TOutput>): Promise<TOutput>;
    }

    export abstract class Command<TInput extends object, TOutput extends object> {
        readonly input: TInput;
    }

    export interface PutObjectCommandInput {
        Bucket: string;
        Key: string;
        Body: File | Blob | Buffer | string | Uint8Array;
        ContentType?: string;
    }

    export class PutObjectCommand extends Command<PutObjectCommandInput, object> {
        constructor(input: PutObjectCommandInput);
    }

    export interface GetObjectCommandInput {
        Bucket: string;
        Key: string;
    }

    export class GetObjectCommand extends Command<GetObjectCommandInput, object> {
        constructor(input: GetObjectCommandInput);
    }

    export interface DeleteObjectCommandInput {
        Bucket: string;
        Key: string;
    }

    export class DeleteObjectCommand extends Command<DeleteObjectCommandInput, object> {
        constructor(input: DeleteObjectCommandInput);
    }
}

declare module '@aws-sdk/s3-request-presigner' {
    import { S3Client, Command } from '@aws-sdk/client-s3';
    
    export interface PresignerOptions {
        expiresIn?: number;
    }

    export function getSignedUrl<TInput extends object, TOutput extends object>(
        client: S3Client,
        command: Command<TInput, TOutput>,
        options?: PresignerOptions
    ): Promise<string>;
}

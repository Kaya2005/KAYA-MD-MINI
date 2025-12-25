/**
 * KAYA-MD - EXIF Helper (ESModule)
 * Convert images/videos to WebP and add sticker metadata
 */

import fs from 'fs';
import { tmpdir } from 'os';
import Crypto from 'crypto';
import ff from 'fluent-ffmpeg';
import pkg from 'node-webpmux';
const { Image } = pkg;
import path from 'path';

/**
 * Convert image buffer to WebP
 */
export async function imageToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.webp`);
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.jpg`);
    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec','libwebp',
                "-vf","scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
            ])
            .toFormat('webp')
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

/**
 * Convert video buffer to WebP
 */
export async function videoToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.webp`);
    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.mp4`);
    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec','libwebp',
                "-vf","scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                '-loop','0','-ss','00:00:00','-t','00:00:05','-preset','default','-an','-vsync','0'
            ])
            .toFormat('webp')
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

/**
 * Add EXIF metadata to WebP
 */
export async function writeExif(media, metadata) {
    let wMedia = /webp/.test(media.mimetype) ? media.data
        : /image/.test(media.mimetype) ? await imageToWebp(media.data)
        : /video/.test(media.mimetype) ? await videoToWebp(media.data)
        : null;

    if (!wMedia) throw new Error('Unsupported media type');

    const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.webp`);
    fs.writeFileSync(tmpFileIn, wMedia);

    if (metadata.packname || metadata.author) {
        const img = new Image();
        const json = {
            'sticker-pack-id': Crypto.randomBytes(16).toString('hex'),
            'sticker-pack-name': metadata.packname || 'KAYA-MD',
            'sticker-pack-publisher': metadata.author || 'Kaya',
            'emojis': metadata.categories || ['🤖']
        };

        const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length,14,4);

        await img.load(tmpFileIn);
        fs.unlinkSync(tmpFileIn);
        img.exif = exif;
        await img.save(tmpFileOut);
        return tmpFileOut;
    }

    fs.unlinkSync(tmpFileIn);
    return tmpFileOut;
}
#!/usr/bin/env python3
"""Render authored OpsPilot lessons locally: narrated MP4, VTT and transcript.

Requires ffmpeg/ffprobe, Pillow and piper-tts 1.8.0; no hosted generation API.
Voice: fr_FR-siwis-medium (SIWIS dataset, CC BY 4.0), synthetic narration.
Only authored learning content is rendered; quiz answer keys never enter media.
"""
import argparse
import hashlib
import json
import re
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from piper import PiperVoice, SynthesisConfig

W, H = 1280, 720
INK, BLUE, MUTED = '#14243B', '#2563EB', '#52627A'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def wrap(text, font, width, draw):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if line and draw.textlength(trial, font=font) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    return lines + ([line] if line else [])


def timestamp(t):
    ms = round(t * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02}.{ms:03}'


def caption_chunks(text):
    """Keep each spoken/caption unit short enough for two mobile-safe lines."""
    chunks = []
    for clause in re.split(r'(?<=[,;:.!?])\s+', text.strip()):
        words = clause.split()
        while words:
            chunks.append(' '.join(words[:16]))
            words = words[16:]
    return chunks


def render_frame(program, scene, index, total, path):
    im = Image.new('RGB', (W, H), '#F4F7FC')
    d = ImageDraw.Draw(im)
    small = ImageFont.truetype(BOLD, 23)
    title = ImageFont.truetype(BOLD, 54)
    body = ImageFont.truetype(FONT, 35)
    d.rectangle((0, 0, 14, H), fill=BLUE)
    d.text((64, 39), 'OpsPilot  /  FORMATION INTERNE', font=small, fill=BLUE)
    d.rounded_rectangle((1090, 30, 1218, 78), radius=20, fill='#E0EAFF')
    d.text((1110, 40), f'{index + 1} / {total}', font=small, fill=INK)
    y = 114
    for line in wrap(scene['heading'], title, 1120, d):
        d.text((64, y), line, font=title, fill=INK)
        y += 67
    y = max(y + 25, 250)
    for j, text in enumerate(scene['lines']):
        lines = wrap(text, body, 1000, d)
        height = max(74, len(lines) * 44 + 22)
        if y + height > 575:
            raise ValueError(f'Frame overflow: {program["key"]}, scene {index}')
        d.rounded_rectangle((64, y, 1215, y + height), radius=17, fill='white')
        d.ellipse((86, y + 26, 101, y + 41), fill=BLUE)
        for k, line in enumerate(lines):
            d.text((122, y + 13 + k * 44), line, font=body, fill=INK)
        y += height + 12
    # Keep a dedicated dark band for optional burnt-in captions.
    d.rectangle((14, 593, W, H), fill=INK)
    d.text((64, 559), 'Texte • exercice • quiz  |  Voix synthétique SIWIS • CC BY 4.0',
           font=ImageFont.truetype(FONT, 20), fill=MUTED)
    im.save(path)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--program', required=True, type=Path)
    p.add_argument('--model', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    args = p.parse_args()
    program = json.loads(args.program.read_text())
    dest = args.output / program['key']
    dest.mkdir(parents=True, exist_ok=True)
    voice = PiperVoice.load(args.model)
    config = SynthesisConfig(length_scale=1.04, volume=0.85)
    cues, segments, chapter_marks = [], [], []
    elapsed = 0.0
    for i, scene in enumerate(program['video']['scenes']):
        frame = dest / f'scene-{i:02}.png'
        render_frame(program, scene, i, len(program['video']['scenes']), frame)
        chapter_marks.append({'title': scene['heading'], 'seconds': round(elapsed, 3)})
        # Each cue is synthesized independently: measured audio boundaries make
        # caption timing reproducible, without guessing from a total word count.
        chunks = caption_chunks(scene['narration'])
        wavs = []
        for j, sentence in enumerate(chunks):
            wav_path = dest / f'scene-{i:02}-cue-{j:02}.wav'
            with wave.open(str(wav_path), 'wb') as f:
                voice.synthesize_wav(sentence, f, config)
            with wave.open(str(wav_path), 'rb') as f:
                params = f.getparams()
                data = f.readframes(f.getnframes())
            # A small audible pause separates sentences; accounted in timestamps.
            silence = b'\0' * round(params.framerate * .22) * params.sampwidth
            duration = (params.nframes / params.framerate) + .22
            cues.append((elapsed, elapsed + duration, sentence))
            elapsed += duration
            wavs.append((params, data + silence))
        joined = dest / f'scene-{i:02}.wav'
        with wave.open(str(joined), 'wb') as out:
            out.setparams(wavs[0][0])
            for _, data in wavs:
                out.writeframes(data)
        segment = dest / f'scene-{i:02}.mp4'
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-loop', '1', '-framerate', '12', '-i', str(frame), '-i', str(joined),
            '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage',
            '-crf', '28', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k',
            '-shortest', '-threads', '2', str(segment),
        ], check=True)
        segments.append(segment)
        print(f'{program["key"]}: scene {i+1} rendered', flush=True)
    concat = dest / 'concat.txt'
    concat.write_text(''.join(f"file '{x.name}'\n" for x in segments))
    raw = dest / 'raw.mp4'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                    '-f', 'concat', '-safe', '0', '-i', str(concat),
                    '-c', 'copy', '-movflags', '+faststart', str(raw)], check=True)
    vtt = dest / f'{program["key"]}.fr.vtt'
    vtt.write_text('WEBVTT\n\n' + '\n'.join(
        f'{n+1}\n{timestamp(a)} --> {timestamp(b)}\n{text}\n'
        for n, (a, b, text) in enumerate(cues)))
    # Burn captions into the MP4 too, so the file remains understandable when
    # downloaded alone. The VTT is also delivered for editable closed captions.
    srt = dest / 'captions.srt'
    srt.write_text('\n'.join(
        f'{n+1}\n{timestamp(a).replace(".", ",")} --> {timestamp(b).replace(".", ",")}\n{text}\n'
        for n, (a, b, text) in enumerate(cues)))
    video = dest / f'{program["key"]}.mp4'
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(raw),
        '-vf', f"subtitles='{srt}':force_style='FontName=DejaVu Sans,FontSize=14,PrimaryColour=&HFFFFFF,OutlineColour=&H3B2414,BorderStyle=1,Outline=1,MarginV=8,MarginL=25,MarginR=25'",
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
        '-c:a', 'copy', '-movflags', '+faststart',
        '-metadata', 'comment=OpsPilot. Synthetic narration: Piper fr_FR-siwis-medium. SIWIS voice dataset CC BY 4.0. Source: https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD',
        '-threads', '2', str(video),
    ], check=True)
    transcript = dest / f'{program["key"]}-transcription.md'
    transcript.write_text(f'# {program["video"]["title"]}\n\n'
        + '\n\n'.join(f'## {s["heading"]}\n\n{s["narration"]}' for s in program['video']['scenes'])
        + '\n\nNarration synthétique : Piper, voix fr_FR-siwis-medium. '
          'Données vocales SIWIS, CC BY 4.0 : '
          'https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD. '
          'Adaptation et contenu pédagogique : OpsPilot.\n')
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(video)]))
    manifest = {
        'key': program['key'], 'version': program['version'],
        'duration_seconds': float(probe['format']['duration']),
        'size_bytes': video.stat().st_size,
        'sha256': hashlib.sha256(video.read_bytes()).hexdigest(),
        'width': W, 'height': H, 'video_codec': 'h264', 'audio_codec': 'aac',
        'narration': 'synthetic', 'voice': 'fr_FR-siwis-medium',
        'voice_dataset_license': 'CC-BY-4.0',
        'voice_model_card': 'https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD',
        'captions_burned_in': True, 'caption_cues': len(cues),
        'chapters': chapter_marks,
    }
    (dest / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()

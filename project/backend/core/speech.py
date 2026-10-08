import asyncio

import edge_tts


VOICES = {
    "en-US": "en-US-AriaNeural",
    "th-TH": "th-TH-PremwadeeNeural",
}


async def _generate_audio(text: str, voice: str) -> bytes:
    audio = bytearray()
    communicate = edge_tts.Communicate(text, voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
    if not audio:
        raise RuntimeError("The speech service returned no audio")
    return bytes(audio)


def synthesize_audio(text: str, language: str) -> bytes:
    voice = VOICES[language]
    return asyncio.run(_generate_audio_with_retry(text, voice))


async def _generate_audio_with_retry(text: str, voice: str) -> bytes:
    from edge_tts.exceptions import NoAudioReceived

    for attempt in range(3):
        try:
            return await _generate_audio(text, voice)
        except NoAudioReceived:
            if attempt == 2:
                raise
            await asyncio.sleep(0.5 * (attempt + 1))
    raise RuntimeError("The speech service returned no audio")
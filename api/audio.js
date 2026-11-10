/*
 * /api/audio — narrate a chapter as an MP3 through Treg (MiniMax Speech 2.8 HD).
 * Price: $1 per 10,000 characters (a typical chapter of 3,000 characters ≈ $0.30).
 *
 *   POST { text, speed }  → { url, chars, cost }   (the MP3 link lasts 24 hours; download it)
 */
const { treg, guard, readBody } = require('./_treg');
const MAX = 9500;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!guard(req, res)) return;
  const b = readBody(req);
  const text = String(b.text || '').replace(/\s+\n/g, '\n').trim();
  if (text.length < 20) return res.status(400).json({ error: 'text', message: 'There is not enough text to narrate.' });
  if (text.length > MAX) return res.status(400).json({ error: 'text', message: `That chapter is too long for one recording (${text.length} characters, limit ${MAX}). Pick a shorter chapter.` });
  const speed = Math.max(0.7, Math.min(1.3, Number(b.speed) || 1));
  try {
    const { json, cost } = await treg('minimax.voice-gen.speech-2-8-hd', {
      body: {
        model: 'speech-2.8-hd', text, stream: false, output_format: 'url', language_boost: 'English',
        voice_setting: { voice_id: 'English_expressive_narrator', speed, vol: 1, pitch: 0 },
        audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 }
      }
    });
    const url = json && json.data && json.data.audio;
    const status = json && json.base_resp && json.base_resp.status_code;
    if (!url || (status && status !== 0)) return res.status(502).json({ error: 'upstream', message: (json && json.base_resp && json.base_resp.status_msg) || 'No audio came back.' });
    return res.status(200).json({ url, chars: text.length, cost: cost || Math.round(text.length / 10000 * 100) / 100 });
  } catch (e) {
    return res.status(e.status === 402 ? 402 : 502).json({ error: e.status === 402 ? 'balance' : 'upstream', message: e.message });
  }
};

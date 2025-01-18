import { env, pipeline } from '@xenova/transformers';
import { encodeWAV } from './utils';

// Disable local model checks
env.allowLocalModels = false;

class MyTextToSpeechPipeline {
    static hindi_model_id = 'Xenova/mms-tts-hin';
    static hindi_pipeline = null;

    static async getInstance(progress_callback = null) {
        if (this.hindi_pipeline === null) {
            try {
                this.hindi_pipeline = await pipeline('text-to-speech', this.hindi_model_id, {
                    progress_callback,
                    quantized: false
                });
            } catch (error) {
                console.error('Pipeline initialization error:', error);
                throw error;
            }
        }
        return this.hindi_pipeline;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    try {
        // Get pipeline instance
        const pipeline = await MyTextToSpeechPipeline.getInstance(progress => {
            self.postMessage({ status: 'loading', progress });
        });

        // Generate speech
        const output = await pipeline(event.data.text);
        console.log(output, 'pipeline')
        // Convert to WAV format
        const wav = encodeWAV(output.audio, output.sampling_rate);

        // Send result back
        self.postMessage({
            status: 'complete',
            audio: new Blob([wav], { type: 'audio/wav' })
        });

    } catch (error) {
        console.error('TTS generation error:', error);
        self.postMessage({
            status: 'error',
            error: error.message
        });
    }
});
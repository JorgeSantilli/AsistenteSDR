/**
 * @file audio-capture.ts
 * @description Utilidades para la captura de audio y transcripción en tiempo real usando Web Speech API y MediaRecorder.
 */

/**
 * Clase principal para gestionar la captura de audio desde el micrófono o el sistema
 * y proporcionar transcripciones en vivo.
 */
export class AudioCapture {
    private mediaRecorder: MediaRecorder | null = null
    private audioContext: AudioContext | null = null
    private stream: MediaStream | null = null

    // Streams individuales
    private micStream: MediaStream | null = null
    private systemStream: MediaStream | null = null

    // Callbacks y config
    private onTranscriptCallback: ((text: string, isFinal: boolean, source: 'sdr' | 'client') => void) | null = null
    private deepgramKey: string | null = null

    // Transcribers
    private recognitionMic: any = null
    private deepgramSystem: DeepgramTranscriber | null = null

    // Grabación
    private audioChunks: Blob[] = []
    private startTime: number = 0

    /**
     * Crea una instancia de AudioCapture.
     * @param onTranscript Callback que se invoca cuando se genera una nueva transcripción.
     * @param deepgramKey (Opcional) API Key de Deepgram para transcripción de audio del sistema.
     */
    constructor(
        onTranscript: (text: string, isFinal: boolean, source: 'sdr' | 'client') => void,
        deepgramKey?: string
    ) {
        this.onTranscriptCallback = onTranscript
        this.deepgramKey = deepgramKey || null
    }

    /**
     * Inicia la captura de audio.
     */
    async startCapture(source: 'microphone' | 'system' | 'both' = 'microphone') {
        try {
            let micStream: MediaStream | null = null
            let systemStream: MediaStream | null = null

            // 1. Obtener streams de audio
            if (source === 'microphone' || source === 'both') {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                })
            }

            if (source === 'system' || source === 'both') {
                try {
                    // @ts-ignore
                    systemStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
                    })
                } catch (e) {
                    console.warn("System audio permission denied or cancelled.")
                }
            }

            // 2. Configurar transcripción

            // A. Micrófono -> Usamos Web Speech API (Gratis y bueno para el SDR)
            if (micStream) {
                this.micStream = micStream
                this.initializeSpeechRecognition() // Inicia recognitionMic
            }

            // B. Sistema -> Usamos Deepgram si hay Key, sino no podemos transcribir
            if (systemStream) {
                this.systemStream = systemStream

                if (this.deepgramKey) {
                    console.log('Initializing Deepgram for System Audio...')
                    this.deepgramSystem = new DeepgramTranscriber(this.deepgramKey, (text, isFinal) => {
                        if (this.onTranscriptCallback) {
                            this.onTranscriptCallback(text, isFinal, 'client')
                        }
                    })
                    // Pasamos el stream del sistema a Deepgram
                    await this.deepgramSystem.startStreaming(systemStream)
                } else {
                    console.warn('⚠️ No Deepgram API Key: System audio will be recorded but NOT transcribed live.')
                }
            }

            // 3. Mezclar para grabación (MediaRecorder)
            const audioContext = new AudioContext()
            const destination = audioContext.createMediaStreamDestination()

            if (micStream && micStream.getAudioTracks().length > 0) {
                audioContext.createMediaStreamSource(micStream).connect(destination)
            }
            if (systemStream && systemStream.getAudioTracks().length > 0) {
                audioContext.createMediaStreamSource(systemStream).connect(destination)
            }

            this.stream = destination.stream
            this.audioContext = audioContext // Guardar context para cerrarlo luego

            if (!this.stream.getAudioTracks().length) {
                throw new Error('No audio tracks available to record.')
            }

            // Inicializar Grabación
            this.initializeRecording()
            this.startTime = Date.now()

            return true
        } catch (error) {
            this.cleanupStreams()
            console.error('Error starting audio capture:', error)
            throw error
        }
    }

    private cleanupStreams() {
        // Stop Web Speech
        if (this.recognitionMic) {
            this.recognitionMic.stop()
            this.recognitionMic = null
        }

        // Stop Deepgram
        if (this.deepgramSystem) {
            this.deepgramSystem.stop()
            this.deepgramSystem = null
        }

        // Stop Tracks
        [this.micStream, this.systemStream, this.stream].forEach(stream => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop())
            }
        })
        this.micStream = null
        this.systemStream = null
        this.stream = null

        // Close Context
        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
        }
    }

    private initializeRecording() {
        if (!this.stream) return

        try {
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            })

            this.audioChunks = []

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data)
                }
            }

            this.mediaRecorder.start(1000)
        } catch (error) {
            console.error('Error initializing recorder:', error)
        }
    }

    private initializeSpeechRecognition() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) return

        this.recognitionMic = new SpeechRecognition()
        this.recognitionMic.continuous = true
        this.recognitionMic.interimResults = true
        this.recognitionMic.lang = 'es-AR'

        this.recognitionMic.onresult = (event: any) => {
            const result = event.results[event.results.length - 1]
            const text = result[0].transcript
            const isFinal = result.isFinal

            if (this.onTranscriptCallback) {
                this.onTranscriptCallback(text, isFinal, 'sdr')
            }
        }

        this.recognitionMic.onerror = (event: any) => {
            if (event.error === 'no-speech') return
            console.error('Speech recognition error (MIC):', event.error)
        }

        this.recognitionMic.onend = () => {
            // Reiniciar si la sesión sigue activa (startTime > 0)
            if (this.startTime && this.recognitionMic) {
                try {
                    this.recognitionMic.start()
                } catch (e) {
                    console.log('Safe restart ignored')
                }
            }
        }

        this.recognitionMic.start()
    }

    async stopCapture(): Promise<{ audioBlob: Blob | null; durationSeconds: number }> {
        const durationSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0

        // Detener lógica de transcripción y streams
        this.cleanupStreams()

        // Finalizar Grabación
        let audioBlob: Blob | null = null
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            await new Promise<void>((resolve) => {
                if (!this.mediaRecorder) { resolve(); return }
                this.mediaRecorder.onstop = () => {
                    if (this.audioChunks.length > 0) {
                        audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
                    }
                    resolve()
                }
                this.mediaRecorder.stop()
            })
            this.mediaRecorder = null
        }

        return { audioBlob, durationSeconds }
    }

    /**
     * Verifica si hay una captura activa en este momento.
     * @returns boolean
     */
    isCapturing(): boolean {
        return this.stream !== null && this.stream.active
    }
}

/**
 * Clase alternativa para transcripción usando Deepgram (requiere API Key).
 * Proporciona mayor precisión y soporte para múltiples hablantes.
 */
export class DeepgramTranscriber {
    private audioContext: AudioContext | null = null
    private processor: ScriptProcessorNode | null = null
    private socket: WebSocket | null = null
    private stream: MediaStream | null = null

    /**
     * @param apiKey API Key de Deepgram.
     * @param onTranscript Callback para resultados de transcripción.
     */
    constructor(
        private apiKey: string,
        private onTranscript: (text: string, isFinal: boolean) => void
    ) { }

    /**
     * Inicia el flujo de transcripción en tiempo real vía WebSocket.
     */
    async startRealTimeTranscription(source: 'microphone' | 'system' = 'microphone') {
        // ... (existing implementation for startRealTimeTranscription logic if needed, but we focus on startStreaming being called from outside)
    }

    /**
     * Inicia el envío de audio crudo al socket en pequeños fragmentos (PCM16).
     */
    public async startStreaming(stream: MediaStream) {
        if (!stream) {
            console.error('Deepgram: No stream provided')
            return
        }

        console.log('Deepgram: Connecting to WebSocket...')

        this.socket = new WebSocket(
            'wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&language=es',
            ['token', this.apiKey]
        )

        this.socket.onopen = () => {
            console.log('Deepgram: WebSocket OPEN')
            this.setupAudioProcessing(stream)
        }

        this.socket.onmessage = (message) => {
            const data = JSON.parse(message.data)
            const transcript = data.channel?.alternatives?.[0]?.transcript
            if (transcript) {
                console.log('Deepgram Transcript:', transcript)
                this.onTranscript(transcript, data.is_final)
            }
        }

        this.socket.onerror = (error) => {
            console.error('Deepgram WebSocket ERROR:', error)
        }

        this.socket.onclose = () => {
            console.log('Deepgram: WebSocket CLOSED')
        }
    }

    private setupAudioProcessing(stream: MediaStream) {
        try {
            this.audioContext = new AudioContext({ sampleRate: 16000 })
            const source = this.audioContext.createMediaStreamSource(stream)
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)

            source.connect(this.processor)
            this.processor.connect(this.audioContext.destination)

            this.processor.onaudioprocess = (e) => {
                if (this.socket?.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0)
                    const pcm16 = this.convertFloat32ToInt16(inputData)
                    this.socket.send(pcm16)
                }
            }
            console.log('Deepgram: Audio processing started')
        } catch (e) {
            console.error('Deepgram: Error setting up audio processing', e)
        }
    }

    /**
     * Convierte muestras de audio de Float32 a Int16 para ahorro de ancho de banda y compatibilidad.
     * @private
     */
    private convertFloat32ToInt16(buffer: Float32Array): Int16Array {
        const int16 = new Int16Array(buffer.length)
        for (let i = 0; i < buffer.length; i++) {
            const s = Math.max(-1, Math.min(1, buffer[i]))
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        return int16
    }

    /**
     * Cierra el socket y libera los recursos de audio.
     */
    stop() {
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
        if (this.processor) {
            this.processor.disconnect()
            this.processor = null
        }
        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop())
            this.stream = null
        }
    }
}

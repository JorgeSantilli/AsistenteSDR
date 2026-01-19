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
    private micStream: MediaStream | null = null
    private systemStream: MediaStream | null = null
    private onTranscriptCallback: ((text: string, isFinal: boolean, source: 'sdr' | 'client') => void) | null = null
    private recognitionMic: any = null
    private recognitionSystem: any = null
    private audioChunks: Blob[] = []
    private startTime: number = 0

    /**
     * Crea una instancia de AudioCapture.
     * @param onTranscript Callback que se invoca cuando se genera una nueva transcripción.
     */
    constructor(onTranscript: (text: string, isFinal: boolean, source: 'sdr' | 'client') => void) {
        this.onTranscriptCallback = onTranscript
    }

    /**
     * Inicia la captura de audio.
     * @param source Origen del audio: 'microphone', 'system' (audio del escritorio) o 'both'.
     * @returns Promesa que resuelve a true si la captura se inició correctamente.
     * @throws Error si no se puede acceder a los dispositivos de audio o el usuario deniega el permiso.
     */
    async startCapture(source: 'microphone' | 'system' | 'both' = 'microphone') {
        try {
            let micStream: MediaStream | null = null
            let systemStream: MediaStream | null = null

            // Obtener audio del micrófono
            if (source === 'microphone' || source === 'both') {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                })
            }

            // Obtener audio del sistema (compartir pantalla/pestaña con audio)
            if (source === 'system' || source === 'both') {
                try {
                    // @ts-ignore - getDisplayMedia con audio
                    systemStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true, // Se requiere video para getDisplayMedia en la mayoría de los navegadores
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false
                        }
                    })
                } catch (e) {
                    // El audio del sistema puede no estar disponible o el usuario canceló
                }
            }

            // Mezclar streams si tenemos ambos, usando AudioContext
            if (micStream && systemStream) {
                const audioContext = new AudioContext()
                const destination = audioContext.createMediaStreamDestination()

                let combinedTracks = 0

                // Conectar Micrófono si tiene audio
                if (micStream.getAudioTracks().length > 0) {
                    const micSource = audioContext.createMediaStreamSource(micStream)
                    micSource.connect(destination)
                    combinedTracks++
                }

                // Conectar Audio de Sistema solo si tiene audio (Evita InvalidStateError)
                if (systemStream.getAudioTracks().length > 0) {
                    const systemSource = audioContext.createMediaStreamSource(systemStream)
                    systemSource.connect(destination)
                    combinedTracks++
                } else {
                    console.warn('System stream has no audio tracks. Make sure to check "Share audio" in the picker.')
                }

                this.stream = destination.stream
                this.audioContext = audioContext
                this.micStream = micStream
                this.systemStream = systemStream
            } else {
                this.stream = micStream || systemStream
                this.micStream = micStream
                this.systemStream = systemStream
            }

            if (!this.stream) {
                throw new Error('No se pudo capturar audio')
            }

            // Inicializar Web Speech API para transcripción
            // NOTA: La API nativa sólo escucha el micrófono por defecto.
            // Para separar fuentes, lo ideal es usar Deepgram o similar.
            this.initializeSpeechRecognition()

            // Inicializar MediaRecorder para grabación de audio persistente
            this.initializeRecording()

            this.startTime = Date.now()

            return true
        } catch (error) {
            // Limpiar si falló a mitad de camino
            this.cleanupStreams()
            console.error('Error starting audio capture:', error)
            throw error
        }
    }

    private cleanupStreams() {
        if (this.micStream) {
            this.micStream.getTracks().forEach(t => t.stop())
            this.micStream = null
        }
        if (this.systemStream) {
            this.systemStream.getTracks().forEach(t => t.stop())
            this.systemStream = null
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop())
            this.stream = null
        }
    }

    /**
     * Inicializa el grabador de medios para guardar el audio crudo.
     * @private
     */
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

            this.mediaRecorder.start(1000) // Colectar datos cada segundo
        } catch (error) {
            console.error('Error initializing recorder:', error)
        }
    }

    /**
     * Inicializa el motor de reconocimiento de voz nativo del navegador.
     * @private
     */
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

        // Error handling and auto-restart
        this.recognitionMic.onerror = (event: any) => {
            if (event.error === 'no-speech') return // Silenciar error común de silencio
            console.error('Speech recognition error (MIC):', event.error)
        }

        this.recognitionMic.onend = () => {
            // Intentar reiniciar si todavía deberíamos estar capturando
            if (this.startTime && this.recognitionMic) {
                try {
                    this.recognitionMic.start()
                } catch (e) {
                    console.log('Safe restart ignored')
                }
            }
        }

        this.recognitionMic.start()

        // Para el sistema, la API nativa no permite pasar un stream arbitrario.
        // Se necesitaría una API de terceros (Deepgram/OpenAI) para transcribir el stream del sistema.
        // Por ahora, simulamos una segunda instancia para mantener la estructura,
        // pero informamos al usuario sobre esta limitación.
        console.log('Web Speech API initialized for Microphone.')
    }

    /**
     * Detiene la captura de audio y devuelve el blob grabado y la duración.
     * @returns Promesa con el objeto { audioBlob, durationSeconds }.
     */
    async stopCapture(): Promise<{ audioBlob: Blob | null; durationSeconds: number }> {
        const durationSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0

        if (this.recognitionMic) {
            this.recognitionMic.stop()
            this.recognitionMic = null
        }

        if (this.recognitionSystem) {
            this.recognitionSystem.stop()
            this.recognitionSystem = null
        }

        let audioBlob: Blob | null = null

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            // Esperar a que los últimos datos se procesen
            await new Promise<void>((resolve) => {
                if (!this.mediaRecorder) {
                    resolve()
                    return
                }

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

        // Detener todos los tracks de audio/video abiertos (mic, sistema y combinado)
        this.cleanupStreams()

        // Cerrar el contexto de audio si se usó para mezclar
        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
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
        try {
            const constraints: MediaStreamConstraints = {
                audio: source === 'system'
                    ? {
                        // @ts-ignore
                        displaySurface: 'monitor',
                        echoCancellation: false
                    }
                    : {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
            }

            if (source === 'system') {
                // @ts-ignore
                this.stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                })
            } else {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints)
            }

            // Conectar al WebSocket de Deepgram
            this.socket = new WebSocket(
                'wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&language=es',
                ['token', this.apiKey]
            )

            this.socket.onopen = () => {
                this.startStreaming()
            }

            this.socket.onmessage = (message) => {
                const data = JSON.parse(message.data)
                if (data.channel?.alternatives?.[0]?.transcript) {
                    const transcript = data.channel.alternatives[0].transcript
                    const isFinal = data.is_final || false
                    this.onTranscript(transcript, isFinal)
                }
            }

            this.socket.onerror = (error) => {
                console.error('Deepgram WebSocket error:', error)
            }

        } catch (error) {
            console.error('Error starting Deepgram transcription:', error)
            throw error
        }
    }

    /**
     * Inicia el envío de audio crudo al socket en pequeños fragmentos (PCM16).
     * @private
     */
    private startStreaming() {
        if (!this.stream || !this.socket) return

        const audioContext = new AudioContext({ sampleRate: 16000 })
        const source = audioContext.createMediaStreamSource(this.stream)
        const processor = audioContext.createScriptProcessor(4096, 1, 1)

        source.connect(processor)
        processor.connect(audioContext.destination)

        processor.onaudioprocess = (e) => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0)
                const pcm16 = this.convertFloat32ToInt16(inputData)
                this.socket.send(pcm16)
            }
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

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop())
            this.stream = null
        }
    }
}

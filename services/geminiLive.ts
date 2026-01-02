
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { pcmToAudioBuffer, createPcmBlob, base64ToBytes } from "../utils/audioUtils";
import { Listing } from "../types";

export class CradleLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private audioQueue: AudioBufferSourceNode[] = [];
  private sessionPromise: Promise<any> | null = null;
  private isConnected = false;
  
  // Callback to update UI when model speaks
  public onVolumeUpdate: (vol: number) => void = () => {};
  public onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void = () => {};

  constructor() {
    // Use Vite's import.meta.env for client-side environment variables
    this.ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  }

  async connect(listings: Listing[]) {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Request Mic Access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Prepare System Instruction with Inventory
      const inventorySummary = listings
        .filter(l => !l.isSold)
        .slice(0, 30) // Limit context
        .map(l => `${l.title} ($${l.price}, ${l.locationZip})`)
        .join('; ');

      const systemInstruction = `
        You are Cradle Live, a helpful voice assistant for parents buying baby gear.
        Speak briefly, enthusiastically, and clearly. 
        
        Current Inventory: ${inventorySummary}.
        
        If asked about something not in inventory, say you'll keep an eye out.
        If the user wants to see something, ask them to check the "Home Feed".
      `;

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: this.handleError.bind(this),
        }
      });

      this.isConnected = true;
      this.onStatusChange('connected');

    } catch (error) {
      console.error("Live Connection Failed", error);
      this.onStatusChange('error');
    }
  }

  private handleOpen() {
    console.log("Gemini Live Connected");
    if (!this.inputAudioContext || !this.mediaStream) return;

    // Setup Audio Streaming Pipeline
    this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for UI visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      this.onVolumeUpdate(Math.sqrt(sum / inputData.length));

      // Send to Gemini as a PCM blob as per guidelines
      const pcmBlob = createPcmBlob(inputData);
      
      // CRITICAL: Solely rely on sessionPromise resolves to send realtime input as per guidelines
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext) return;

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      try {
        const audioBuffer = await pcmToAudioBuffer(
          base64ToBytes(base64Audio),
          this.outputAudioContext
        );
        
        // Play Audio Queue
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputAudioContext.destination);
        
        // Schedule gapless playback as per guidelines using a nextStartTime cursor
        const currentTime = this.outputAudioContext.currentTime;
        this.nextStartTime = Math.max(this.nextStartTime, currentTime);
        
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        
        // Track sources to stop them later if interrupted
        this.audioQueue.push(source);
        source.onended = () => {
            this.audioQueue = this.audioQueue.filter(s => s !== source);
        };

        // Update UI visualizer
        this.onVolumeUpdate(0.5); 

      } catch (e) {
        console.error("Audio Decode Error", e);
      }
    }

    if (message.serverContent?.interrupted) {
      this.stopAudioQueue();
    }
  }

  private stopAudioQueue() {
    this.audioQueue.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    this.audioQueue = [];
    this.nextStartTime = 0;
  }

  private handleClose() {
    console.log("Gemini Live Closed");
    this.cleanup();
  }

  private handleError(e: ErrorEvent) {
    console.error("Gemini Live Error", e);
    this.onStatusChange('error');
    this.cleanup();
  }

  public disconnect() {
    this.cleanup();
  }

  private cleanup() {
    this.isConnected = false;
    this.onStatusChange('disconnected');
    
    if (this.source) { this.source.disconnect(); this.source = null; }
    if (this.processor) { this.processor.disconnect(); this.processor = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
    if (this.inputAudioContext) { this.inputAudioContext.close(); this.inputAudioContext = null; }
    if (this.outputAudioContext) { this.outputAudioContext.close(); this.outputAudioContext = null; }
    this.stopAudioQueue();
  }
}

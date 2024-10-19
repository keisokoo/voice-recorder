export class WavRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private onStartCallback: (() => void) | null = null;
  private onStopCallback: (() => void) | null = null;

  setCallbacks(onStart: () => void, onStop: () => void) {
    this.onStartCallback = onStart;
    this.onStopCallback = onStop;
  }

  async start(deviceId?: string) {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096; // 더 높은 해상도를 위해 증가
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      if (this.onStartCallback) {
        this.onStartCallback();
      }
    } catch (error) {
      console.error("마이크 시작 실패:", error);
      throw error;
    }
  }

  async stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;

    if (this.onStopCallback) {
      this.onStopCallback();
    }
  }

  getFrequencyData(): { frequencyData: Uint8Array; sampleRate: number } | null {
    if (this.analyser && this.dataArray && this.audioContext) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return {
        frequencyData: this.dataArray,
        sampleRate: this.audioContext.sampleRate,
      };
    }
    return null;
  }
}

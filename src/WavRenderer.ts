export class WavRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  private logScale(
    index: number,
    total: number,
    minFreq: number,
    maxFreq: number
  ): number {
    const minLog = Math.log(minFreq);
    const maxLog = Math.log(maxFreq);
    const scale = (maxLog - minLog) / total;
    return Math.exp(minLog + scale * index);
  }

  render(frequencyData: Uint8Array, sampleRate: number) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const minFreq = 20;
    const maxFreq = 20000;
    const nyquistFrequency = sampleRate / 2;
    const binCount = frequencyData.length;
    const freqStep = nyquistFrequency / binCount;

    // 로그 스케일에서 1:1:1 비율로 주파수 대역 나누기
    const lowMidCutoff = Math.exp(
      (2 * Math.log(minFreq) + Math.log(maxFreq)) / 3
    );
    const midHighCutoff = Math.exp(
      (Math.log(minFreq) + 2 * Math.log(maxFreq)) / 3
    );

    const barCount = 300;
    const barWidth = this.canvas.width / barCount;
    const barHeightScale = this.canvas.height / 255;

    for (let i = 0; i < barCount; i++) {
      const freq = this.logScale(i, barCount, minFreq, maxFreq);
      const binIndex = Math.min(Math.floor(freq / freqStep), binCount - 1);
      const barHeight = Math.max(frequencyData[binIndex] * barHeightScale, 2);

      // 주파수에 따른 색상 결정
      let color: string;
      if (freq < lowMidCutoff) {
        // 저음 (20Hz - lowMidCutoff, 파란색)
        color = "rgb(0, 0, 255)";
      } else if (freq < midHighCutoff) {
        // 중음 (lowMidCutoff - midHighCutoff, 초록색)
        color = "rgb(0, 255, 0)";
      } else {
        // 고음 (midHighCutoff - 20kHz, 빨간색)
        color = "rgb(255, 0, 0)";
      }

      this.ctx.fillStyle = color;

      const x = i * barWidth;
      this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

      // 막대 테두리
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(
        x,
        this.canvas.height - barHeight,
        barWidth,
        barHeight
      );
    }

    // 주파수 대역 구분선
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 3, 0);
    this.ctx.lineTo(this.canvas.width / 3, this.canvas.height);
    this.ctx.moveTo((this.canvas.width * 2) / 3, 0);
    this.ctx.lineTo((this.canvas.width * 2) / 3, this.canvas.height);
    this.ctx.stroke();

    // 주파수 대역 레이블
    this.ctx.fillStyle = "white";
    this.ctx.font = "12px Arial";
    this.ctx.fillText(`저음 (20Hz-${Math.round(lowMidCutoff)}Hz)`, 5, 15);
    this.ctx.fillText(
      `중음 (${Math.round(lowMidCutoff)}Hz-${Math.round(midHighCutoff)}Hz)`,
      this.canvas.width / 3 + 5,
      15
    );
    this.ctx.fillText(
      `고음 (${Math.round(midHighCutoff)}Hz-20kHz)`,
      (this.canvas.width * 2) / 3 + 5,
      15
    );

    // 주요 주파수 표시
    const frequencies = [20, 100, 500, 1000, 2000, 5000, 10000, 20000];
    frequencies.forEach((freq) => {
      const x =
        ((Math.log(freq) - Math.log(minFreq)) /
          (Math.log(maxFreq) - Math.log(minFreq))) *
        this.canvas.width;
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      this.ctx.fillText(`${freq}Hz`, x, this.canvas.height - 5);
    });
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

import React, { useEffect, useRef, useState } from "react";
import "./App.scss";
import { WavRecorder } from "./WavRecorder";
import { WavRenderer } from "./WavRenderer";

const App: React.FC = () => {
  const [micPermission, setMicPermission] = useState<boolean>(false);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<WavRecorder | null>(null);
  const rendererRef = useRef<WavRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        console.log("마이크 권한이 허용되었습니다.");
        setMicPermission(true);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );
        setAudioInputDevices(audioInputs);

        const currentTrack = stream.getAudioTracks()[0];
        const currentDeviceId = currentTrack.getSettings().deviceId;
        setSelectedDevice(currentDeviceId || "");

        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error("마이크 초기화 실패:", error);
        setError(
          "마이크 접근 권한을 얻지 못했습니다. 브라우저 설정을 확인해주세요."
        );
      }
    };

    initializeAudio();
    navigator.mediaDevices.addEventListener("devicechange", updateAudioDevices);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        updateAudioDevices
      );
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const updateAudioDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(
      (device) => device.kind === "audioinput"
    );
    setAudioInputDevices(audioInputs);
  };

  const renderAudio = () => {
    if (recorderRef.current && rendererRef.current) {
      const result = recorderRef.current.getFrequencyData();
      if (result) {
        rendererRef.current.render(result.frequencyData, result.sampleRate);
      }
      animationFrameRef.current = requestAnimationFrame(renderAudio);
    }
  };

  const handleDeviceChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newDeviceId = event.target.value;
    setSelectedDevice(newDeviceId);
    if (isRecording && recorderRef.current) {
      await recorderRef.current.stop();
      await recorderRef.current.start(newDeviceId);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (recorderRef.current) {
        await recorderRef.current.stop();
      }
    } else {
      if (canvasRef.current) {
        try {
          recorderRef.current = new WavRecorder();
          recorderRef.current.setCallbacks(
            () => {
              setIsRecording(true);
              console.log("오디오 입력 확인이 시작되었습니다.");
              renderAudio();
            },
            () => {
              setIsRecording(false);
              console.log("오디오 입력 확인이 중지되었습니다.");
              if (rendererRef.current) {
                rendererRef.current.clear();
              }
              if (animationFrameRef.current !== undefined) {
                cancelAnimationFrame(animationFrameRef.current);
              }
            }
          );
          rendererRef.current = new WavRenderer(canvasRef.current);
          await recorderRef.current.start(selectedDevice);
        } catch (error) {
          console.error("오디오 입력 확인 시작 중 오류 발생:", error);
          setError("오디오 입력 확인을 시작하는 중 오류가 발생했습니다.");
        }
      }
    }
  };

  return (
    <div className="app-container">
      <h1>오디오 입력 확인</h1>
      {error && <p className="error-message">{error}</p>}
      <p className="status-info">
        마이크 권한 상태: {micPermission ? "허용됨" : "대기 중"}
      </p>
      {micPermission && (
        <>
          <div className="audio-controls">
            <label htmlFor="audioDevices">오디오 입력 장치: </label>
            <select
              id="audioDevices"
              value={selectedDevice}
              onChange={handleDeviceChange}
            >
              {audioInputDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `마이크 ${device.deviceId.substr(0, 5)}...`}
                </option>
              ))}
            </select>
            <button onClick={toggleRecording}>
              {isRecording ? "입력 확인 중지" : "입력 확인 시작"}
            </button>
          </div>
          <div className="visualizer-container">
            <canvas ref={canvasRef} width="1920" height="400" />
          </div>
        </>
      )}
    </div>
  );
};

export default App;

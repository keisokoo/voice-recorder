import React, { useRef, useState } from "react";

const WriteTest: React.FC = () => {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const selectDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      setMessage("디렉토리가 선택되었습니다.");
    } catch (error) {
      console.error("디렉토리 선택 오류:", error);
      setMessage("디렉토리 선택 중 오류가 발생했습니다.");
    }
  };

  const startRecording = async () => {
    if (!directoryHandle) {
      setMessage("먼저 디렉토리를 선택해주세요.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await saveRecording(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMessage("녹음이 시작되었습니다.");
    } catch (error) {
      console.error("녹음 시작 오류:", error);
      setMessage("녹음 시작 중 오류가 발생했습니다.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMessage("녹음이 중지되었습니다. 파일 저장 중...");
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    if (!directoryHandle) {
      setMessage("디렉토리가 선택되지 않았습니다.");
      return;
    }

    try {
      const fileName = `녹음_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.wav`;
      const fileHandle = await directoryHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(audioBlob);
      await writable.close();
      setMessage(`녹음이 ${fileName}으로 저장되었습니다.`);
    } catch (error) {
      console.error("파일 저장 오류:", error);
      setMessage("녹음 파일 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <h1>파일 시스템 API 테스트</h1>
      <button onClick={selectDirectory}>디렉토리 선택</button>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "녹음 중지" : "녹음 시작"}
      </button>
      <p>{message}</p>
    </div>
  );
};

export default WriteTest;

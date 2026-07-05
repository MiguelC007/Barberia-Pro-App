import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, FileUp, Paperclip, Video } from "lucide-react";
import type { MediaReference } from "../types";
import { createMediaReference } from "../services/mediaService";

interface MediaCapturePanelProps {
  onAdd: (media: MediaReference[]) => void | Promise<void>;
  labels?: {
    photo?: string;
    video?: string;
    file?: string;
  };
}

type CaptureMode = "photo" | "video" | null;

export function MediaCapturePanel({ onAdd, labels }: MediaCapturePanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const [mode, setMode] = useState<CaptureMode>(null);
  const [preview, setPreview] = useState<MediaReference | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current >= 20) {
          stopRecording();
          return current;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  async function openCamera(nextMode: Exclude<CaptureMode, null>) {
    try {
      cleanupStream();
      setMessage("");
      setPreview(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: nextMode === "video"
      });
      streamRef.current = stream;
      setMode(nextMode);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      }, 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo abrir la camara.");
    }
  }

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    mediaRecorderRef.current = null;
    videoChunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  }

  async function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreview({
      id: `preview_photo_${Date.now()}`,
      type: "image",
      name: `foto-${Date.now()}.jpg`,
      url: dataUrl,
      createdAt: Date.now()
    });
  }

  function startRecording() {
    if (!streamRef.current) return;
    setMessage("");
    setPreview(null);
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size) {
        videoChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = async () => {
      const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
      const media = await createMediaReference({
        file: blob,
        name: `video-${Date.now()}.webm`,
        type: "video",
        preferObjectUrl: true
      });
      setPreview(media);
      setRecording(false);
    };
    recorder.start();
    setRecording(true);
    setSeconds(0);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const media = await Promise.all(
      files.map((file) =>
        createMediaReference({
          file,
          name: file.name,
          type: file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
              ? "video"
              : "file",
          preferObjectUrl: file.type.startsWith("video/")
        })
      )
    );
    await onAdd(media);
    event.target.value = "";
  }

  async function usePreview() {
    if (!preview) return;
    await onAdd([preview]);
    setPreview(null);
    setMode(null);
    cleanupStream();
  }

  function closeModal() {
    setMode(null);
    setPreview(null);
    cleanupStream();
  }

  return (
    <div className="media-panel">
      <div className="actions">
        <button className="btn ghost" onClick={() => openCamera("photo")}>
          <Camera size={16} />
          {labels?.photo || "Tomar foto"}
        </button>
        <button className="btn ghost" onClick={() => openCamera("video")}>
          <Video size={16} />
          {labels?.video || "Grabar video"}
        </button>
        <button className="btn ghost" onClick={() => inputRef.current?.click()}>
          <FileUp size={16} />
          {labels?.file || "Subir archivo"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        capture="environment"
        hidden
        multiple
        onChange={handleFileInput}
      />

      {message && <div className="alert info">{message}</div>}

      {(mode || preview) && (
        <div className="media-modal">
          <div className="media-modal-content">
            {preview ? (
              <div className="media-preview">
                {preview.type === "image" ? (
                  <img src={preview.url} alt={preview.name} />
                ) : preview.type === "video" ? (
                  <video src={preview.url} controls />
                ) : (
                  <div className="summary-card">
                    <Paperclip size={20} />
                    <strong>{preview.name}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="camera-stage">
                <video ref={videoRef} playsInline muted />
                {recording && <span className="badge badge-danger">Grabando {seconds}s</span>}
              </div>
            )}

            <div className="actions">
              {!preview && mode === "photo" && (
                <button className="btn primary" onClick={capturePhoto}>
                  <Camera size={16} />
                  Capturar
                </button>
              )}
              {!preview && mode === "video" && !recording && (
                <button className="btn primary" onClick={startRecording}>
                  <Video size={16} />
                  Iniciar grabacion
                </button>
              )}
              {!preview && mode === "video" && recording && (
                <button className="btn danger" onClick={stopRecording}>
                  <Video size={16} />
                  Detener
                </button>
              )}
              {preview && (
                <button className="btn success" onClick={usePreview}>
                  Usar archivo
                </button>
              )}
              <button className="btn ghost" onClick={closeModal}>
                {preview ? "Cancelar" : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

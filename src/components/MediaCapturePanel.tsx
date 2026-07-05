import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Camera,
  Check,
  FileUp,
  RotateCcw,
  Square,
  Video,
  X,
} from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<CaptureMode>(null);
  const [preview, setPreview] = useState<MediaReference | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, []);

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

  function stopTracksOnly() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function cleanupCamera() {
    stopTracksOnly();
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
    setCameraReady(false);
  }

  async function attachStreamToVideo(stream: MediaStream) {
    await new Promise((resolve) => window.setTimeout(resolve, 60));

    const video = videoRef.current;

    if (!video) {
      setMessage("No se pudo preparar la vista de cámara.");
      return;
    }

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      try {
        await video.play();
        setCameraReady(true);
      } catch {
        setMessage("La cámara abrió, pero el navegador bloqueó la reproducción.");
      }
    };
  }

  async function openCamera(nextMode: Exclude<CaptureMode, null>) {
    try {
      cleanupCamera();
      setPreview(null);
      setMessage("");
      setMode(nextMode);
      setCameraReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("Este navegador no permite abrir cámara. Usá Subir archivo.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: nextMode === "video",
      });

      streamRef.current = stream;
      await attachStreamToVideo(stream);
    } catch (error) {
      setMode(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo abrir la cámara. Revisá permisos del navegador."
      );
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;

    if (!video || !cameraReady) {
      setMessage("Esperá un momento, la cámara todavía está cargando.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setMessage("La cámara aún no entregó imagen. Probá de nuevo en unos segundos.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("No se pudo capturar la foto.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setMessage("No se pudo generar la imagen.");
          return;
        }

        const media = await createMediaReference({
          file: blob,
          name: `foto-${Date.now()}.jpg`,
          type: "image",
        });

        setPreview(media);
        stopTracksOnly();
      },
      "image/jpeg",
      0.92
    );
  }

  function getRecorderOptions() {
    if (!window.MediaRecorder) return undefined;

    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      return { mimeType: "video/webm;codecs=vp8" };
    }

    if (MediaRecorder.isTypeSupported("video/webm")) {
      return { mimeType: "video/webm" };
    }

    return undefined;
  }

  function startRecording() {
    if (!streamRef.current) {
      setMessage("Primero abrí la cámara.");
      return;
    }

    if (!window.MediaRecorder) {
      setMessage("Este navegador no permite grabar video. Usá Subir archivo.");
      return;
    }

    setMessage("");
    setPreview(null);
    chunksRef.current = [];

    const recorder = new MediaRecorder(streamRef.current, getRecorderOptions());
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });

      const media = await createMediaReference({
        file: blob,
        name: `video-${Date.now()}.webm`,
        type: "video",
        preferObjectUrl: true,
      });

      setPreview(media);
      setRecording(false);
      stopTracksOnly();
    };

    recorder.start();
    setRecording(true);
    setSeconds(0);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
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
          preferObjectUrl: file.type.startsWith("video/"),
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
    cleanupCamera();
  }

  async function retake() {
    const currentMode = mode;

    setPreview(null);

    if (currentMode === "photo" || currentMode === "video") {
      await openCamera(currentMode);
    }
  }

  function closeModal() {
    setMode(null);
    setPreview(null);
    setMessage("");
    cleanupCamera();
  }

  return (
    <div className="media-capture-panel">
      <div className="media-action-row">
        <button
          type="button"
          className="btn ghost media-action-button"
          onClick={() => openCamera("photo")}
        >
          <Camera size={18} />
          {labels?.photo || "Tomar foto"}
        </button>

        <button
          type="button"
          className="btn ghost media-action-button"
          onClick={() => openCamera("video")}
        >
          <Video size={18} />
          {labels?.video || "Grabar video"}
        </button>

        <button
          type="button"
          className="btn ghost media-action-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp size={18} />
          {labels?.file || "Subir archivo"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        hidden
        multiple
        type="file"
        accept="image/*,video/*"
        onChange={handleFileInput}
      />

      {message && <div className="alert info">{message}</div>}

      {mode && (
        <div className="media-modal-backdrop" role="dialog" aria-modal="true">
          <div className="media-modal">
            <div className="media-modal-header">
              <div>
                <span className="section-kicker">
                  {mode === "photo" ? "Cámara" : "Video"}
                </span>
                <h3>{mode === "photo" ? "Tomar foto" : "Grabar video"}</h3>
              </div>

              <button type="button" className="icon-button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="media-stage">
              {preview ? (
                <div className="media-preview-stage">
                  {preview.type === "image" ? (
                    <img src={preview.url} alt={preview.name} />
                  ) : preview.type === "video" ? (
                    <video src={preview.url} controls playsInline />
                  ) : (
                    <div className="media-file-preview">
                      <FileUp size={28} />
                      <strong>{preview.name}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="camera-stage">
                  <video ref={videoRef} autoPlay muted playsInline />

                  {!cameraReady && (
                    <div className="camera-loading">
                      Preparando cámara...
                    </div>
                  )}

                  {recording && (
                    <span className="recording-pill">
                      Grabando {seconds}s
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="media-modal-actions">
              {!preview && mode === "photo" && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                >
                  <Camera size={18} />
                  Capturar foto
                </button>
              )}

              {!preview && mode === "video" && !recording && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={startRecording}
                  disabled={!cameraReady}
                >
                  <Video size={18} />
                  Iniciar grabación
                </button>
              )}

              {!preview && mode === "video" && recording && (
                <button type="button" className="btn danger" onClick={stopRecording}>
                  <Square size={18} />
                  Detener
                </button>
              )}

              {preview && (
                <>
                  <button type="button" className="btn primary" onClick={usePreview}>
                    <Check size={18} />
                    Usar archivo
                  </button>

                  <button type="button" className="btn ghost" onClick={retake}>
                    <RotateCcw size={18} />
                    Repetir
                  </button>
                </>
              )}

              <button type="button" className="btn ghost" onClick={closeModal}>
                Cancelar
              </button>
            </div>

            <p className="media-help-text">
              La cámara funciona en localhost o HTTPS. Si el navegador bloquea permisos,
              usá la opción de subir archivo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
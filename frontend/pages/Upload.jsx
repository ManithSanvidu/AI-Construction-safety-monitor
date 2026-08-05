import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/video/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.status === "success") {
        setTaskId(data.task_id);
        setOriginalUrl(data.original_video_url);
        pollStatus(data.task_id);
      } else {
        setMessage(JSON.stringify(data));
      }
    } catch (err) {
      setMessage(String(err));
    }
  }

  async function pollStatus(id) {
    const interval = 2000;
    const poll = async () => {
      try {
        const res = await fetch(`/api/video/status/${id}`);
        const data = await res.json();
        setProgress(data.progress || 0);
        if (data.processed_video_url) {
          setProcessedUrl(data.processed_video_url);
        }
        if (data.message) {
          setMessage(data.message);
        }
        if (data.status === "done" || data.status === "error") {
          return;
        }
      } catch (err) {
        setMessage(String(err));
      }
      setTimeout(poll, interval);
    };
    poll();
  }

  return (
    <div>
      <h2>Upload video</h2>
      <form onSubmit={handleUpload}>
        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Upload</button>
      </form>

      {message && <div style={{ color: "red" }}>{message}</div>}

      {originalUrl && (
        <div>
          <h3>Original</h3>
          <video width="640" controls src={originalUrl} />
        </div>
      )}

      {processedUrl && (
        <div>
          <h3>Processed</h3>
          <video width="640" controls src={processedUrl} />
        </div>
      )}

      <div>Progress: {progress}%</div>
    </div>
  );
}

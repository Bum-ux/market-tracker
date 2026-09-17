import { useEffect, useState } from "react";
import api from "../services/api";

interface VideoItem {
  id: number;
  title: string;
  channelTitle: string;
  watchUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  state: "VIDEO" | "UPCOMING" | "LIVE" | "ENDED";
  scheduledStartAt: string | null;
}

const labels = { VIDEO: "Video", UPCOMING: "Sắp phát", LIVE: "Đang trực tiếp", ENDED: "Đã kết thúc" };

export default function VideoList() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await api.get("/videos/list");
        if (active) {
          setVideos(response.data.data);
          setError("");
        }
      } catch {
        if (active) setError("Không tải được danh sách video. Vui lòng thử lại sau.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return (
    <section aria-label="Video và livestream">
      <h2>Video và livestream</h2>
      {loading && <p role="status">Đang tải video…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && videos.length === 0 && <p>Chưa có video.</p>}
      <div className="row g-3">
        {videos.map((video) => (
          <article key={video.id} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100">
              {playing === video.id && video.embedUrl ? (
                <iframe className="ratio ratio-16x9" style={{ aspectRatio: "16 / 9", width: "100%" }}
                  src={video.embedUrl} title={video.title} allowFullScreen
                  allow="encrypted-media; picture-in-picture" />
              ) : video.thumbnailUrl && (
                <img className="card-img-top" src={video.thumbnailUrl} alt="" loading="lazy" />
              )}
              <div className="card-body">
                <span className={`badge ${video.state === "LIVE" ? "text-bg-danger" : "text-bg-secondary"}`}>
                  {labels[video.state]}
                </span>
                <h3 className="h5 mt-2">{video.title}</h3>
                <p>{video.channelTitle}</p>
                {video.state === "UPCOMING" && video.scheduledStartAt && (
                  <p>Lịch phát: {new Date(video.scheduledStartAt).toLocaleString("vi-VN")}</p>
                )}
                {video.embedUrl && <button type="button" className="btn btn-primary me-2"
                  onClick={() => setPlaying(playing === video.id ? null : video.id)}>
                  {playing === video.id ? "Đóng video" : "Phát video"}
                </button>}
                <a href={video.watchUrl} target="_blank" rel="noopener noreferrer">Xem trên YouTube</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface Notification {
  id: number;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  news: { link: string } | null;
  video: { watchUrl: string } | null;
  market: { coinId: string } | null;
}

interface NotificationPage {
  items: Notification[];
  unreadCount: number;
  nextCursor: number | null;
}

function safeUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<NotificationPage>({
    items: [],
    unreadCount: 0,
    nextCursor: null,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await api.get<{ data: NotificationPage }>(
        "/notifications",
        { signal },
      );
      if (!signal?.aborted) {
        setPage(response.data.data);
        setError("");
      }
    } catch {
      if (!signal?.aborted) setError("Không tải được thông báo. Hãy thử lại.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    // Fetch stored notifications; their creation is driven by backend events.
    const timer = window.setInterval(() => {
      if (!document.hidden && !open) void refresh(controller.signal);
    }, 60000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refresh, open]);

  const markRead = async (id?: number) => {
    setBusy(true);
    try {
      await api.patch(
        id ? `/notifications/${id}/read` : "/notifications/read-all",
      );
      // Preserve pagination while updating read status.
      setPage((current) => ({
        ...current,
        unreadCount: id ? Math.max(0, current.unreadCount - 1) : 0,
        items: current.items.map((item) =>
          !id || item.id === id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      }));
      setError("");
    } catch {
      setError("Không đánh dấu đã đọc được. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const loadMore = async () => {
    if (!page.nextCursor) return;
    setBusy(true);
    try {
      const response = await api.get<{ data: NotificationPage }>(
        `/notifications?before=${page.nextCursor}`,
      );
      const next = response.data.data;
      setPage((current) => ({
        ...next,
        items: [...current.items, ...next.items],
      }));
      setError("");
    } catch {
      setError("Không tải được thông báo. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="position-relative">
      <button
        className="btn btn-link nav-link"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="notification-panel"
      >
        Thông báo{" "}
        <span className="badge bg-danger" aria-live="polite">
          {page.unreadCount}
        </span>
      </button>
      {open && (
        <section
          id="notification-panel"
          aria-label="Thông báo"
          className="position-absolute bg-white border rounded shadow p-3"
          style={{
            right: 0,
            width: "min(360px, 85vw)",
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Thông báo</strong>
            <button
              className="btn btn-sm btn-link"
              disabled={busy || !page.unreadCount}
              onClick={() => void markRead()}
            >
              Đọc tất cả
            </button>
          </div>
          {error && (
            <div role="alert" className="text-danger small">
              {error}
            </div>
          )}
          <button
            className="btn btn-sm btn-outline-secondary mb-2"
            disabled={busy}
            onClick={() => void refresh()}
          >
            Làm mới
          </button>
          {!page.items.length && !error && (
            <p className="text-muted">Chưa có thông báo.</p>
          )}
          {page.items.map((item) => {
            const url = safeUrl(item.news?.link ?? item.video?.watchUrl);
            return (
              <article
                key={item.id}
                className={`border-top py-2 ${item.readAt ? "" : "bg-light"}`}
              >
                <div className={item.readAt ? "" : "fw-bold"}>{item.title}</div>
                <p className="small mb-1">{item.message}</p>
                <time className="text-muted small" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </time>
                <div className="d-flex gap-2 align-items-center">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Xem nội dung
                    </a>
                  )}
                  {item.market && (
                    <Link to="/markets" onClick={() => setOpen(false)}>
                      Xem market
                    </Link>
                  )}
                  {!item.readAt && (
                    <button
                      className="btn btn-sm btn-link"
                      disabled={busy}
                      onClick={() => void markRead(item.id)}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {page.nextCursor && (
            <button
              className="btn btn-sm btn-link"
              disabled={busy}
              onClick={() => void loadMore()}
            >
              Xem thêm
            </button>
          )}
        </section>
      )}
    </div>
  );
}

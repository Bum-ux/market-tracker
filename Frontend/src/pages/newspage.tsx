import { useState, useEffect } from "react";
import api from "../services/api";

interface NewsItem {
  id: number;
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  categoryId: number | null;
}

function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get("/news/list");
      setNews(response.data.data);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1>Danh sách tin tức</h1>
      {news.map((item) => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.contentSnippet}</p>
        </div>
      ))}
    </div>
  );
}

export default NewsPage;

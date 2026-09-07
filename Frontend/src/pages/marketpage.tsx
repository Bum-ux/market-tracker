import { useEffect, useState } from "react";
import api from "../services/api";

interface Coin {
  id: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

function MarketPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await api.get("/market/cryptoData");
        setCoins(response.data.data);
      } catch {
        setError("Cannot load market");
      } finally {
        setLoading(false);
      }
    };
    fetchMarket();
  }, []);

  if (loading) return <p>Loading market...</p>;

  if (error) return <p>{error}</p>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Crypto Market</h2>

      <div className="table-responsive">
        <table className="table table-hober align-middle">
          <thead className="table-light">
            <tr>
              <th>Coin</th>
              <th className="text-end">Price</th>
              <th className="text-end">24h</th>
            </tr>
          </thead>

          <tbody>
            {coins.map((coin) => (
              <tr key={coin.id}>
                <td>{coin.name}</td>

                <td className="text-end">
                  ${coin.current_price.toLocaleString()}
                </td>

                <td
                  className={`text-end fw-bold ${
                    coin.price_change_percentage_24h >= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {coin.price_change_percentage_24h.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MarketPage;

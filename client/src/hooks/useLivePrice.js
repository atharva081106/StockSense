import { useState, useEffect, useRef } from "react";
import { getSocket, subscribeToStock, unsubscribeFromStock } from "../services/socket";

const useLivePrice = (symbol) => {
  const [data, setData]   = useState(null);
  const prevRef           = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    const socket = getSocket();
    subscribeToStock(symbol);

    const handler = (d) => {
      if (d.symbol?.toUpperCase() !== symbol.toUpperCase()) return;
      d._dir = prevRef.current == null ? "neutral"
             : d.price > prevRef.current ? "up"
             : d.price < prevRef.current ? "down" : "neutral";
      prevRef.current = d.price;
      setData(d);
    };

    socket.on("price_update", handler);
    return () => { socket.off("price_update", handler); unsubscribeFromStock(symbol); };
  }, [symbol]);

  return data;
};

export default useLivePrice;

export async function fetchStockPrice(ticker: string, apiKey: string): Promise<number | null> {
    try {
        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`);
        const data = await response.json();

        // Alpha Vantage structure: "Global Quote": { "05. price": "123.45" }
        const quote = data["Global Quote"];
        if (!quote || !quote["05. price"]) {
            return null;
        }

        const price = parseFloat(quote["05. price"]);
        if (isNaN(price)) return null;

        // Convert to cents/fils (integer)
        return Math.round(price * 100);
    } catch (error) {
        console.error("Stock fetch error:", error);
        return null;
    }
}

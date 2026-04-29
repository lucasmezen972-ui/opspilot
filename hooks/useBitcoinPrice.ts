import { useEffect, useState } from 'react'

interface CoinGeckoResponse {
  bitcoin?: {
    usd?: number
  }
}

export function useBitcoinPrice() {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = async () => {
    try {
      setLoading(true)
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: CoinGeckoResponse = await res.json()
      setPrice(data.bitcoin?.usd ?? null)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération du prix BTC:', err)
      setError('Impossible de récupérer le prix')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)
    return () => clearInterval(interval)
  }, [])

  return { price, loading, error, refetch: fetchPrice }
}

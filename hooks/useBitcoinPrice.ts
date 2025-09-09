import { useEffect, useState } from 'react'

interface BitcoinApiResponse {
  bpi?: {
    USD?: {
      rate_float?: number
    }
  }
}

export function useBitcoinPrice() {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = async () => {
    try {
      setLoading(true)
      const res = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json')
      const data: BitcoinApiResponse = await res.json()
      setPrice(data.bpi?.USD?.rate_float ?? null)
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

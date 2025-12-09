import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Spin, message } from 'antd'
import { calendarService } from '../services/calendarService'

export default function InstagramCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [messageText, setMessageText] = useState('Processing Instagram connection...')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessageText(`Connection failed: ${error}`)
      message.error(`Connection failed: ${error}`)
      setTimeout(() => {
        navigate('/settings')
      }, 2000)
      return
    }

    if (!code || !state) {
      setStatus('error')
      setMessageText('Missing authorization code or state')
      message.error('Missing authorization code or state')
      setTimeout(() => {
        navigate('/settings')
      }, 2000)
      return
    }

    // Call backend to process the callback
    handleCallback(code, state)
  }, [searchParams, navigate])

  const handleCallback = async (code: string, state: string) => {
    try {
      setMessageText('Connecting Instagram account...')
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Call backend to process the OAuth callback
      // Note: Backend will return JSON if Authorization header is present, otherwise redirect
      const response = await fetch(`/api/social/instagram/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        redirect: 'manual', // Don't follow redirects automatically
      })

      // Check if response is a redirect
      if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 301) {
        // Backend redirected us (e.g., to Facebook Page)
        // We can't read the redirect URL from opaque redirect, so we'll handle it differently
        // Actually, with redirect: 'manual', we should check the Location header
        const location = response.headers.get('Location')
        if (location && location.includes('facebook.com')) {
          // Redirect to Facebook Page management
          window.location.href = location
          return
        }
      }

      // If response is JSON (success or error)
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        // If response is not JSON, it might be an error
        const text = await response.text()
        throw new Error(`Invalid response: ${text}`)
      }
      
      if (data.success) {
        setStatus('success')
        setMessageText('Successfully connected! Redirecting...')
        message.success('Instagram and Facebook Page connected successfully!')
        
        // Redirect based on response
        if (data.redirectUrl) {
          setTimeout(() => {
            window.location.href = data.redirectUrl
          }, 1500)
        } else {
          setTimeout(() => {
            navigate('/settings?instagram_connected=true')
          }, 1500)
        }
      } else {
        throw new Error(data.message || 'Connection failed')
      }
    } catch (error: unknown) {
      console.error('Callback error:', error)
      setStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMessageText(`Connection failed: ${errorMessage}`)
      message.error(`Connection failed: ${errorMessage}`)
      setTimeout(() => {
        navigate('/settings')
      }, 2000)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
    }}>
      <Spin size="large" />
      <p>{messageText}</p>
    </div>
  )
}


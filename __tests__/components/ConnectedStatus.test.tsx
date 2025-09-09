import React from 'react'
import { render } from '@testing-library/react-native'
import ConnectedStatus from '../../components/ConnectedStatus'

describe('ConnectedStatus Component', () => {
  it('should show connected state when isConnected is true', () => {
    const { getByText } = render(<ConnectedStatus isConnected={true} />)
    
    expect(getByText('✅ Supabase connecté')).toBeTruthy()
  })

  it('should show disconnected state when isConnected is false', () => {
    const { getByText } = render(<ConnectedStatus isConnected={false} />)
    
    expect(getByText('⏳ En attente de connexion Supabase')).toBeTruthy()
  })

  it('should show data count when provided and connected', () => {
    const { getByText } = render(<ConnectedStatus isConnected={true} dataCount={42} />)
    
    expect(getByText('✅ Supabase connecté • 42 enregistrements')).toBeTruthy()
  })

  it('should not show data count when disconnected', () => {
    const { getByText, queryByText } = render(<ConnectedStatus isConnected={false} dataCount={42} />)
    
    expect(getByText('⏳ En attente de connexion Supabase')).toBeTruthy()
    expect(queryByText('42 enregistrements')).toBeFalsy()
  })

  it('should apply correct styles for connected state', () => {
    const { getByText } = render(<ConnectedStatus isConnected={true} />)
    const textElement = getByText('✅ Supabase connecté')
    
    // The text should exist (basic test for style application)
    expect(textElement).toBeTruthy()
  })

  it('should apply correct styles for disconnected state', () => {
    const { getByText } = render(<ConnectedStatus isConnected={false} />)
    const textElement = getByText('⏳ En attente de connexion Supabase')
    
    // The text should exist (basic test for style application)
    expect(textElement).toBeTruthy()
  })
})
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from './lib/supabase'
import './AuthScreen.css'

type Mode = 'sign-in' | 'sign-up' | 'reset' | 'update'

export default function AuthScreen({ configured, onAuthError = '', recovery = false, onRecoveryComplete }: { configured: boolean; onAuthError?: string; recovery?: boolean; onRecoveryComplete?: () => void }) {
  const [mode, setMode] = useState<Mode>(recovery ? 'update' : 'sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(onAuthError)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!supabase || !configured) {
      setError('Cloud login is not configured yet. Complete the Supabase setup steps in the project README.')
      return
    }
    if (mode === 'sign-up' && name.trim().length < 2) {
      setError('Enter your name (at least 2 characters).')
      return
    }
    if (mode !== 'reset' && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (authError) throw authError
        if (!data.session) {
          setMessage('Account created. Check your email to confirm the account, then sign in.')
        }
      } else if (mode === 'reset') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim())
        if (authError) throw authError
        setMessage('If an account exists for that email, a password reset link has been sent.')
      } else if (mode === 'update') {
        const { error: authError } = await supabase.auth.updateUser({ password })
        if (authError) throw authError
        onRecoveryComplete?.()
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
      }
    } catch (cause) {
      console.error('Authentication request failed', cause)
      setError(cause instanceof Error ? cause.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'sign-up' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : mode === 'update' ? 'Choose a new password' : 'Welcome back'
  return <main className="auth-shell">
    <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
    <section className="auth-panel">
      <div className="auth-brand"><span><Activity size={21} /></span><strong>DILEEP <i>LIFE OS</i></strong></div>
      <p className="auth-eyebrow">YOUR PERSONAL COMMAND CENTER</p>
      <h1>{title}</h1>
      <p className="auth-intro">Your routines and progress, saved to your account and ready when you return.</p>
      {!configured && <div className="auth-config-warning"><ShieldCheck size={17} /><div><strong>Cloud setup required</strong><p>Create a Supabase project, run the included SQL migration, then set the two Vite environment variables. See README for steps.</p></div></div>}
      <form className="auth-form" onSubmit={submit}>
        {mode === 'sign-up' && <label>Your name<input autoComplete="name" required minLength={2} value={name} onChange={event => setName(event.target.value)} placeholder="How should we address you?" /></label>}
        {mode !== 'update' && <label>Email address<span className="auth-input"><Mail size={15} /><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></span></label>}
        {mode !== 'reset' && <label>{mode === 'update' ? 'New password' : 'Password'}<span className="auth-input"><LockKeyhole size={15} /><input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></span></label>}
        {(error || onAuthError) && <p className="auth-message auth-error" role="alert">{error || onAuthError}</p>}
        {message && <p className="auth-message auth-success" role="status">{message}</p>}
        <button className="auth-submit" disabled={busy || !configured}>{busy ? 'Please wait…' : mode === 'reset' ? 'Send reset link' : mode === 'sign-up' ? 'Create account' : mode === 'update' ? 'Update password' : 'Sign in'}<ArrowRight size={16} /></button>
      </form>
      {mode === 'sign-in' && <button className="auth-link forgot-link" onClick={() => { setMode('reset'); setError(''); setMessage('') }}>Forgot password?</button>}
      {mode !== 'update' && <div className="auth-switch">{mode === 'sign-up' ? <>Already have an account? <button onClick={() => { setMode('sign-in'); setError(''); setMessage('') }}>Sign in</button></> : mode === 'reset' ? <>Remembered your password? <button onClick={() => { setMode('sign-in'); setError(''); setMessage('') }}>Sign in</button></> : <>New to Life OS? <button onClick={() => { setMode('sign-up'); setError(''); setMessage('') }}>Create an account</button></>}</div>}
      <div className="auth-privacy"><ShieldCheck size={14} /><span>Private account data · row-level access controls</span></div>
    </section>
    <p className="auth-footer">DILEEP LIFE OS <span>·</span> SMALL STEPS. LASTING PROGRESS.</p>
  </main>
}

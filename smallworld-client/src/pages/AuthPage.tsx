/**
 * Auth Page Component
 *
 * The landing page for authentication.
 * Provides login and signup forms with a side-by-side rules panel.
 *
 * Features:
 * - Toggle between login and signup modes
 * - Username and password inputs
 * - Display name input (optional, signup only)
 * - Error display
 * - Rules reference panel
 */

import { useState } from 'react';
import { Panel } from '../components/ui/panel';
import { RulesSection } from '../components/RulesSection';

interface AuthPageProps {
  /** Callback for login attempt */
  onLogin: (username: string, password: string) => Promise<boolean>;
  /** Callback for signup attempt */
  onSignup: (username: string, password: string, playerName?: string) => Promise<boolean>;
  /** Error message to display */
  error: string | null;
  /** Clear error message */
  onClearError: () => void;
}

export default function AuthPage({ onLogin, onSignup, error, onClearError }: AuthPageProps) {
  /** Current mode: 'login' or 'signup' */
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  /** Username input value */
  const [username, setUsername] = useState('');

  /** Password input value */
  const [password, setPassword] = useState('');

  /** Display name input value (signup only) */
  const [playerName, setPlayerName] = useState('');

  /** Whether a request is in progress */
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) return;

    setLoading(true);

    if (mode === 'login') {
      await onLogin(username.trim(), password);
    } else {
      await onSignup(username.trim(), password, playerName.trim() || undefined);
    }

    setLoading(false);
  };

  /**
   * Switch between login and signup modes
   */
  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    onClearError();
  };

  // Input styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1.1rem',
    outline: 'none',
    backgroundColor: 'white',
    border: '3px solid #2d3436',
    borderRadius: '0.5rem',
    color: '#2d3436',
    boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
  };

  // Button base style
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1.5rem',
    letterSpacing: '0.05em',
    backgroundColor: '#ff6b35',
    color: '#F0EAD6',
    border: '4px solid #2d3436',
    borderRadius: '0.5rem',
    boxShadow: '5px 5px 0px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'auto',
        fontFamily: "'Bangers', cursive",
        backgroundColor: '#2d3436',
      }}
    >
      {/* Diagonal stripes background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          backgroundImage: 'repeating-linear-gradient(45deg, #4a5f3a 0px, #4a5f3a 40px, #3d4f2f 40px, #3d4f2f 80px)',
        }}
      />

      {/* Main content - two column layout */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1200px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Panel - Login/Signup */}
        <Panel
          title="WAR ZONE!"
          subtitle={mode === 'login' ? 'WELCOME BACK, SOLDIER!' : 'ENLIST NOW!'}
        >
          {/* Error display */}
          {error && (
            <div
              style={{
                backgroundColor: '#ff6b35',
                border: '3px solid #2d3436',
                color: '#F0EAD6',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '1.1rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '1.25rem', color: '#2d3436' }}>
                CALLSIGN:
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* Password input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '1.25rem', color: '#2d3436' }}>
                SECRET CODE:
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                disabled={loading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {/* Display name input (signup only) */}
            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '1.25rem', color: '#2d3436' }}>
                  SOLDIER NAME: <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="How others will see you"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!username.trim() || !password.trim() || loading}
              style={{
                ...buttonStyle,
                opacity: (!username.trim() || !password.trim() || loading) ? 0.5 : 1,
                cursor: (!username.trim() || !password.trim() || loading) ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.boxShadow = '7px 7px 0px rgba(0,0,0,0.3)';
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '5px 5px 0px rgba(0,0,0,0.3)';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
            >
              {loading
                ? (mode === 'login' ? 'DEPLOYING...' : 'ENLISTING...')
                : (mode === 'login' ? 'DEPLOY!' : 'ENLIST!')}
            </button>
          </form>

          {/* Mode toggle */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#2d3436', fontSize: '1rem' }}>
              {mode === 'login' ? "New recruit?" : 'Already enlisted?'}
              <button
                onClick={toggleMode}
                disabled={loading}
                style={{
                  marginLeft: '0.5rem',
                  color: '#ff6b35',
                  fontWeight: 'bold',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  textDecoration: 'underline',
                }}
              >
                {mode === 'login' ? 'SIGN UP' : 'LOG IN'}
              </button>
            </p>
          </div>
        </Panel>

        {/* Right Panel - Rules */}
        <Panel
          title="RULES OF WAR"
          subtitle="KNOW YOUR BATTLEFIELD"
        >
          <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            <RulesSection embedded />
          </div>
        </Panel>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import './App.css'

const SETTINGS ={
  easy: { max: 50, attempts: 10 , timeLimit: 60},
  medium: { max: 100, attempts: 10, timeLimit: 60},
  hard: { max:200, attempts: 8, timeLimit: 60}
}

const ICONS = {
  default: '▣',
  warm: '⚡',
  cold: '❄',
  success: '✓',
  victory: '★'
}

function App(){
  const [mode, setMode] = useState('medium')
  const [target,setTarget] = useState(() => Math.floor(Math.random()*100) + 1)
  const [maxRange, setMAXRange] = useState(100)
  const [attempts, setAttempts] = useState(10)
  const [hints, setHints] = useState(1)
  const [guesses, setGuesses] = useState([])
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState({ state: 'default', text: 'READY PLAYER ONE'})
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameStarted, setGameStarted] = useState(false)
  const [showVictory, setShowVictory] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('gtn_highscore') || '0'))
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [playerName, setPlayerName] =useState('')
  const [lastDiff, setLastDiff] = useState(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const audioCtxRef = useRef(null)

  const getAudioCtx = () => {
    if(!audioCtxRef.current){
      audioCtxRef.current = new (window.Audio.Context || window.webkitAudioContext)()

    }
    return audioCtxRef.current
  }
  const playSound = (type) => {
    if(!soundEnabled) return
    try{
      const ctx =getAudioCtx()
      const now = ctx.currentTime
      const profiles ={
        tick: [{ freq: 880, dur: 0.06, vol: 0.08, wave: 'square'}],
        guess: [{ freq: 440, dur:0.1, vol:0.1, wave: 'sine'}, {freq:520, dur: 0.1, vol: 0.08, wave: 'sine'}],
        warm: [{ freq: 600, dur: 0.18, vol: 0.12, wave: 'sine'},{freq:800, dur:0.18, vol:0.1, wave:'sine'}],
        cold: [{ freq: 220, dur: 0.25, vol: 0.1, wave: 'sawtooth'}],
        victory: [{ freq: 523.25, dur: 0.4, vol:0.15,wave: 'sine'},{freq: 659.25, dur:0.4, vol: 0.15, wave: 'sine'}],
        hint: [{ freq: 523.25, dur:0.15, vol:0.1, wave: 'sine'}, { freq: 659.25, dur:0.15, vol:0.1, wave: 'sine'}]
      }

      const sounds = profiles[type] || []
      sounds.forEach(s => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = s.wave 
        osc.frequency.setValueAtTime(s.freq, now)
        gain.gain.setValueAtTime(s.vol, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + s.dur)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + (s.delay || 0))
        osc.stop(now +(s.delay || 0) + s.dur)
      })
    }catch(e){}
  }

  useEffect(() => {
    if(gameStarted && timeLeft >0){
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if(t <=1){
            clearInterval(timerRef.current)
            playSound('cold')
            setResult({ state: 'cold', text: `TIME UP! Number was ${target}` })
            setTimeout(resetGame, 2500)
            return 0
          }
          if( t%10 ===0) playSound('tick')
            return t-1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [gameStarted, timeLeft] )

  useEffect(() => {
    if(gameStarted && inputRef.current){
      inputRef.current.focus()
    }
  }, [gameStarted])

  const startGame = () => {
    setGameStarted(true)
    setResult({ state: 'default', text: 'MAKE YOUR GUESS!'})
    setTarget(Math.floor(Math.random() * maxRange) + 1)
    setAttempts(SETTINGS[mode].attempts)
    setHints(1)
    setGuesses([])
    setTimeLeft(SETTINGS[mode].timeLimit)
    setLastDiff(null)

  }
  const resetGame = () => {
    setGameStarted(false)
    setGuess('')
    setResult({state:'default', text: 'READY PLAYER ONE'})
    setAttempts(SETTINGS[mode].attempts)
    setHints(1)
    setGuesses([])
    setTimeLeft(SETTINGS[mode].timeLimit)
    setShowVictory(false)
    setTarget(Math.floor((Math.random() * SETTINGS[mode].max) +1))
  }

  const changeMode = (newMode) => {
    setMode(newMode)
    setMAXRange(SETTINGS[newMode].max)
    setAttempts(SETTINGS[newMode].attempts)
    setTimeLeft(SETTINGS[newMode].timeLimit)
    setTarget(Math.floor(Math.random() * SETTINGS[newMode].max) + 1)
    setGuesses([])
    setResult({ state: 'default', text: 'LEVEL CHANGED'})
    setGameStarted(false)
  }

  const handleGuess = (e) => {
    e.preventDefault()
    if(!gameStarted) return
    const num = parseInt(guess)
    if(!num || num<1 || num > maxRange) {
      playSound('cold')
      setResult({ state: 'cold', text: `ENTER 1-${maxRange}`})
      return
    }
    playSound('guess')
    setGuesses([...guesses, num])
    if(num === target){
      playSound('victory')
    setResult({ state: 'victory', text: `YOU WIN! The number was ${target}`})
    if(attempts > highScore){
      setHighScore(attempts)
      localStorage.setItem('gtn_highscore', String(attempts))
    }
    setTimeout(() => setShowVictory(true), 800)
    return
    }

    const diff = Math.abs(num - target)
    const warmth = lastDiff === null ? '' : diff < lastDiff ? ' (WARMER!)' : ' (COLDER...)'
    setLastDiff(diff)
    if(diff < Math.floor(maxRange / 10)){
      playSound('warm')
      setResult({ state: 'warm', text: `CLOSE!${warmth}`})
    } else{
      playSound('cold')
      setResult({ state: 'cold', text: `MISS!${warmth}`})
    }
    const newAttempts = attempts -1
    setAttempts(newAttempts)
    if(newAttempts <=0){
      playSound('cold')
      setResult({ state: 'cold',text: `GAME OVER! Number was ${target}`})
      setTimeout(resetGame, 2500)
    }
    setGuess('')
  }
  const useHint = () => {
    if(hints <= 0 || !gameStarted) return
    playSound('hint')
    const parity = target % 2 ===0 ? 'EVEN' : 'ODD'
    const mid = Math.floor(maxRange / 2)
    const range = target <= mid ? `1-${mid}` : `${mid + 1} - ${maxRange}`
    setHints(hints - 1)
    setResult({ state: 'default', text: `HINT: ${parity}, ${range}`})
  }
    const getWarmthPercent = () => {
      if(guesses.length === 0) return 0
      const last = guesses[guesses.length - 1]
      const distance = Math.abs(last - target)
      return Math.max(0, 100 - (distance / maxRange) * 100)
    }
  const LB_KEY = 'gtn_leaderboard'
  const loadLeaderboard = () => {
    try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]') } catch{ return []}
  }
  const [lbFilter, setLbFilter] = useState('all')
  const leaderboard = loadLeaderboard().sort((a,b) => b.score - a.score).slice(0,15)
  const filteredLB = lbFilter === 'all' ? leaderboard : leaderboard.filter(e => e.difficulty === lbFilter)
  return(
    <>
      <div className= "crt-overlay"></div>
      <div className = "scanlines"></div>
      <div className = "tv-glow"></div>
      <button className="sound-toggle" onClick={() => setSoundEnabled(!soundEnabled)}>
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      <main className="game-container">
        <header className="game-header">
          <div className="pixel-decoration">❎❎❎</div>
          <h1 className="glitch" data-text="GUESS THE NUMBER">GUESS THE NUMBER</h1>
          <p className="tagline">◆ INSERT COIN TO PLAY ◆</p>
        </header>
        <section className="player-setup">
        <label className="retro-label">PLAYER:</label>
        <div className="player-input-row">
          <input 
            type="text"
            maxLength= {12}
            placeholder="NAME?"
            value = {playerName}
            onChange={e => setPlayerName(e.target.value)}
            />
            <button className="btn-retro btn-small" onClick={() => setShowLeaderboard(true)}>SCORES</button>
        </div>
        </section>

        <section className="game-board">
          <div className="difficulty-selector">
            <label className="retro-label">LEVEL:</label>
            <div className="level-buttons">
              {['easy', 'medium', 'hard'].map((m,i) => (
                <button key ={m} className={`lvl-btn ${mode === m ? 'active' : ''}`} onClick={() => changeMode(m)}>
                  {i + 1}
                </button>
              ))
              }
            </div>
          </div>

          <div className="timer-zone">
            <div className="timer-track">
              <div className="timer-fill" style={{
                width: `${(timeLeft /SETTINGS[mode].timeLimit) * 100}%`,
                 background: timeLeft <= 10 ? 'repeating-linear-gradient(90deg, #ff2a6d, #ff2a6d 8px, transparent 8px, transparent 12px)' :
                           timeLeft <= 20 ? 'repeating-linear-gradient(90deg, #ff6b35, #ff6b35 8px, transparent 8px, transparent 12px)' :
                           'repeating-linear-gradient(90deg, #39ff14, #39ff14 8px, transparent 8px, transparent 12px)'
              }}></div>
            </div>
            <span className= "timer-text">TIME: {timeLeft}</span>
          </div>

          <div className="range-display">
            <span className="range-label">1</span>
            <div className="range-bar"><div className="range-marker"></div></div>
            <span className="range-label">{maxRange}</span>
          </div>

          <form className="input-zone" onSubmit={handleGuess}>
            <input 
              ref={inputRef}
              type="number"
              placeholder='??'
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled= {!gameStarted}
              min={1}
              max={maxRange}
               />
               <button type="submit" className="btn-retro btn-action" disabled={!gameStarted}>GUESS</button>
          </form>
          <div className ="action-buttons">
            <button className="btn-retro btn-secondary" onClick={useHint} disabled={!gameStarted || hints <= 0}>
              HINT<span>{hints}</span>
            </button>
            <button className="btn-retro btn-secondary" onClick={resetGame}>RESET</button>
          </div>
          <button className="btn-start" onClick={startGame} style={{ display: gameStarted ? 'none' : 'block' }}>
            <span className="blink">► START ◄</span>
          </button>
        </section>

        <section className={`feedback-zone`}>
          <div className={`result-display ${result.state}`}>
            <span className="result-icon">{ICONS[result.state]}</span>
            <span className="result-text">{result.text}</span>
           </div>
        </section>

        <section className="stats-zone">
          <div className="stat-box">
            <span className="stat-label">CHANCES</span>
            <span className="stat-value">{attempts}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">POINTS</span>
            <span className="stat-value">{attempts}</span>
          </div>
          <div className="stat-box stat-best">
            <span className="stat-label">HIGH SCORE</span>
            <span className="stat-value">{highScore}</span>
          </div>
        </section>

        <section className="history-zone">
          <div className="history-header">
            <span className="retro-label">PREVIOUS:</span>
            <span className="history-value">{guesses.length}</span>
          </div>
          <div className="guess-history">
            {guesses.slice(-8).map((g,i) => <span key={i}>{g}</span>)}
          </div>
        </section>

        <footer className="game-footer">
          <div className="warmth-bar">
            <div className="warmth-fill" style={{ width: `${getWarmthPercent()}%` }}></div>
          </div>
          <p className="hint-text">PRESS [ENTER] TO GUESS</p>
        </footer>
      </main>
      {showVictory && (
        <div className="victory-overlay active">
          <div className="victory-content">
            <div className="pixel-art-star">★</div>
            <h2 className="victory-title">YOU WIN!</h2>
            <p className="victory-number">SECRET: <strong>{target}</strong></p>
            <p className="victory-score">SCORE: <span>{attempts}</span></p>
            <button className="btn-retro" onClick={() => { setShowVictory(false); resetGame();}}>CONTINUE</button>
          </div>
        </div>
      )}
      {showLeaderboard && (
        <div className="leaderboard-overlay active" onClick={(e) => e.target === e.currentTarget && setShowLeaderboard(false)}>
          <div className="leaderboard-modal">
            <div className="leaderboard-header">
            <h2>🏆 HIGH SCORES</h2>
            <button className="btn-close" onClick={() => setShowLeaderboard(false)}>✕</button>
            </div>
            <div className="difficulty-tabs">
              {['all', 'easy', 'medium', 'hard'].map(f => (
                <button key={f} className={`tab-btn ${lbFilter === f ? 'active' : ''}`} onClick={() => setLbFilter(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
             <div className="score-list">
              {filteredLB.length === 0 ? (
                <p className="lb-empty">NO SCORES YET</p>
              ) : (
                filteredLB.map((entry, i) => (
                  <div key={i} className={`score-row ${i === 0 ? 'top' : ''}`}>
                    <span className="score-rank">{['①', '②', '③'][i] || i + 1}</span>
                    <span className="score-name">{entry.name || 'ANON'}</span>
                    <span className={`score-difficulty ${entry.difficulty}`}>{entry.difficulty.toUpperCase()}</span>
                    <span className="score-points">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </>
  )
}

export default App
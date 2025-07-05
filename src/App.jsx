import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [numPoints, setNumPoints] = useState(5)
  const [gameState, setGameState] = useState('setup')
  const [points, setPoints] = useState([])
  const [currentPoint, setCurrentPoint] = useState(1)
  const [timeLeft, setTimeLeft] = useState(3.0)
  const [gameTime, setGameTime] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [clickedPoints, setClickedPoints] = useState({}) 
  const timerRef = useRef(null)
  const gameTimerRef = useRef(null)
  const fadeTimerRef = useRef({})

  const generatePoints = (count) => {
    const newPoints = []
    for (let i = 1; i <= count; i++) {
      newPoints.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        clicked: false,
        hidden: false
      })
    }
    return newPoints
  }

  const startGame = () => {
    const newPoints = generatePoints(numPoints)
    setPoints(newPoints)
    setCurrentPoint(1)
    setTimeLeft(3.0)
    setGameTime(0)
    setGameState('playing')
    
    gameTimerRef.current = setInterval(() => {
      setGameTime(prev => prev + 0.1)
    }, 100)
  }

  const startPointTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          hideCurrentPoint()
          return 3.0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
  }

  const handlePointClick = (pointId) => {
    if (gameState !== 'playing') return

    if (pointId === currentPoint) {
      if (pointId === 1) {
        startPointTimer()
      }
      
      setPoints(prev => prev.map(p => 
        p.id === pointId ? { ...p, clicked: true } : p
      ))
      
      setClickedPoints(prev => ({...prev, [pointId]: 3.0}))
      
      fadeTimerRef.current[pointId] = setInterval(() => {
        setClickedPoints(prev => {
          const newTime = prev[pointId] - 0.1
          if (newTime <= 0) {
            setPoints(prevPoints => prevPoints.map(p => 
              p.id === pointId ? { ...p, hidden: true } : p
            ))
            clearInterval(fadeTimerRef.current[pointId])
            delete fadeTimerRef.current[pointId]
            
            if (pointId === numPoints) {
              setGameState('allCleared')
              setAutoPlay(false)
              clearInterval(timerRef.current)
              clearInterval(gameTimerRef.current)
            }
            
            return { ...prev, [pointId]: 0 }
          }
          return { ...prev, [pointId]: newTime }
        })
      }, 100)
      
      if (pointId !== numPoints) {
        setCurrentPoint(prev => prev + 1)
        setTimeLeft(3.0)
      }
    } else {
      setGameState('gameOver')
      setAutoPlay(false)
      clearInterval(timerRef.current)
      clearInterval(gameTimerRef.current)
    }
  }

  const hideCurrentPoint = () => {
    setPoints(prev => prev.map(p => 
      p.id === currentPoint ? { ...p, hidden: true } : p
    ))
    
    if (currentPoint === numPoints) {
      setGameState('gameOver')
      setAutoPlay(false)
      clearInterval(timerRef.current)
      clearInterval(gameTimerRef.current)
    } else {
      setCurrentPoint(prev => prev + 1)
      setTimeLeft(3.0)
    }
  }

  const restartGame = () => {
    setGameState('setup')
    setPoints([])
    setCurrentPoint(1)
    setTimeLeft(3.0)
    setGameTime(0)
    setAutoPlay(false)
    setClickedPoints({})
    clearInterval(timerRef.current)
    clearInterval(gameTimerRef.current)
    Object.values(fadeTimerRef.current).forEach(timer => clearInterval(timer))
    fadeTimerRef.current = {}
  }

  useEffect(() => {
    if (autoPlay && gameState === 'playing') {
      const autoPlayTimer = setTimeout(() => {
        const targetPoint = points.find(p => p.id === currentPoint)
        if (targetPoint && !targetPoint.clicked) {
          handlePointClick(currentPoint)
        }
      }, currentPoint === 1 ? 1000 : 500)
      
      return () => clearTimeout(autoPlayTimer)
    }
  }, [autoPlay, gameState, currentPoint, points])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearInterval(gameTimerRef.current)
      Object.values(fadeTimerRef.current).forEach(timer => clearInterval(timer))
    }
  }, [])

  return (
    <div className="game-container">
      <h1 className={gameState === 'gameOver' ? 'game-over' : gameState === 'allCleared' ? 'all-cleared' : ''}>
        {gameState === 'gameOver' && 'GAME OVER'}
        {gameState === 'allCleared' && 'ALL CLEARED'}
        {(gameState === 'setup' || gameState === 'playing') && "LET'S PLAY"}
      </h1>
      
      <div className="game-controls">
        <div className="control-group">
          <label>Points:</label>
          <input 
            type="number" 
            value={numPoints} 
            onChange={(e) => setNumPoints(Math.max(1, parseInt(e.target.value)) || 1)}
            disabled={gameState === 'playing'}
            min="1"
            max="20"
          />
        </div>
        
        <div className="control-group">
          <label>Time:</label>
          <span className="time-display">{gameTime.toFixed(1)}s</span>
        </div>
        
        <div className="button-group">
          <button onClick={gameState === 'setup' ? startGame : restartGame}>
            {gameState === 'setup' ? 'Start' : 'Restart'}
          </button>
          {gameState === 'playing' && (
            <button 
              onClick={() => setAutoPlay(!autoPlay)}
              className={autoPlay ? 'active' : ''}
            >
              Auto Play {autoPlay ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      <div className="game-board">
        <div className="points-container">
          {points.map(point => {
            if (point.hidden) return null
            
            const isCurrentPoint = point.id === currentPoint
            const fadeTime = clickedPoints[point.id]
            const fadeOpacity = fadeTime ? fadeTime / 3.0 : 1
            
            return (
              <div
                key={point.id}
                className={`point ${point.clicked ? 'clicked' : ''} ${isCurrentPoint ? 'current' : ''} ${isCurrentPoint && timeLeft === 0 ? 'timeout' : ''}`}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  opacity: point.clicked ? fadeOpacity : 1,
                }}
                onClick={() => handlePointClick(point.id)}
              >
                {point.clicked ? (
                  <div className="point-content">
                    <div className="point-number">{point.id}</div>
                    <div className="point-timer">{(fadeTime / 3.0 * 3).toFixed(1)}s</div>
                  </div>
                ) : (
                  point.id
                )}
              </div>
            )
          })}
        </div>
        
      </div>
      
      {gameState === 'playing' && currentPoint <= numPoints && (
        <div className="next-point">
          Next: {currentPoint}
        </div>
      )}
    </div>
  )
}

export default App

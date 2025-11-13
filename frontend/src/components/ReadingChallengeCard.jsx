import { useState, useEffect } from 'react'

function ReadingChallengeCard({ challengeData: propChallengeData = null }) {
  const [challengeData, setChallengeData] = useState({
    completed: 0,
    target: 52,
    percentage: 0,
    remaining: 52
  })

  useEffect(() => {
    if (propChallengeData) {
      setChallengeData(propChallengeData)
    } else {
      // Fallback: calculate from localStorage
      try {
        const read = JSON.parse(localStorage.getItem('read') || '[]')
        const currentYear = new Date().getFullYear()
        const yearStart = new Date(currentYear, 0, 1)
        
        // This is a simplified calculation - in real app, would check completion dates
        const completed = read.length
        const target = 52
        const percentage = Math.round((completed / target) * 100)
        const remaining = Math.max(0, target - completed)

        setChallengeData({
          completed,
          target,
          percentage: Math.min(percentage, 100),
          remaining
        })
      } catch (e) {
        console.error('Error calculating challenge data:', e)
      }
    }
  }, [propChallengeData])

  return (
    <div className="bg-dark-gray dark:bg-white border-2 border-white/30 dark:border-dark-gray/30 p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base text-white dark:text-dark-gray font-medium mb-1 uppercase tracking-wider">
          Reading Challenge
        </h3>
        <p className="text-sm text-white/70 dark:text-dark-gray/70">
          {challengeData.completed} of {challengeData.target} books completed
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 bg-white/10 dark:bg-dark-gray/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-700 dark:bg-emerald-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${challengeData.percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-white/60 dark:text-dark-gray/60">
        <span className="font-medium">
          {challengeData.percentage}% complete
        </span>
        <span className="font-medium">
          {challengeData.remaining} books to go
        </span>
      </div>
    </div>
  )
}

export default ReadingChallengeCard


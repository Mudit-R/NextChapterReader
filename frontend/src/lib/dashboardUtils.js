import { supabase } from './supabaseClient'

/**
 * Fetch all user dashboard data from Supabase
 * @param {string} userId - User ID from auth
 * @returns {Promise<object>} - Complete user dashboard data
 */
export async function fetchUserDashboardData(userId) {
  if (!userId) {
    return {
      profile: null,
      readingSessions: [],
      booksRead: [],
      currentlyReading: [],
      pinnedBooks: [],
      readingStats: {
        totalBooks: 0,
        totalPages: 0,
        activeDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageSession: 0,
        readingSpeed: 0,
        thisMonthBooks: 0,
        thisMonthPages: 0
      },
      monthlyProgress: [],
      genreDistribution: {},
      challengeData: {
        completed: 0,
        target: 52,
        percentage: 0,
        remaining: 52
      }
    }
  }

  try {
    // Fetch all data in parallel
    const [
      profileResult,
      readingSessionsResult,
      booksReadResult,
      currentlyReadingResult,
      pinnedBooksResult,
      genrePreferencesResult,
      monthlyProgressResult
    ] = await Promise.all([
      // User profile
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      // Reading sessions - check if table exists, otherwise use localStorage fallback
      supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .catch(() => ({ data: [], error: null })), // Graceful fallback
      
      // Books read - from user_books or books table with status
      supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', userId)
        .eq('status', 'read')
        .order('completed_at', { ascending: false })
        .catch(() => ({ data: [], error: null })),
      
      // Currently reading
      supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', userId)
        .eq('status', 'reading')
        .order('updated_at', { ascending: false })
        .catch(() => ({ data: [], error: null })),
      
      // Pinned books
      supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', userId)
        .eq('pinned', true)
        .order('pinned_at', { ascending: false })
        .catch(() => ({ data: [], error: null })),
      
      // Genre preferences - try to get from user_profiles
      supabase
        .from('user_profiles')
        .select('genre_preferences')
        .eq('user_id', userId)
        .single()
        .catch(() => ({ data: null, error: null })),
      
      // Monthly progress - try to get from user_profiles
      supabase
        .from('user_profiles')
        .select('monthly_progress')
        .eq('user_id', userId)
        .single()
        .catch(() => ({ data: null, error: null }))
    ])

    // Get reading sessions (with localStorage fallback)
    let readingSessions = []
    if (readingSessionsResult.data && readingSessionsResult.data.length > 0) {
      readingSessions = readingSessionsResult.data
    } else {
      // Fallback to localStorage
      try {
        const localSessions = localStorage.getItem('reading_sessions')
        if (localSessions) {
          readingSessions = JSON.parse(localSessions).map(session => ({
            ...session,
            user_id: userId
          }))
        }
      } catch (e) {
        console.error('Error parsing localStorage reading_sessions:', e)
      }
    }

    // Get books read
    let booksRead = []
    if (booksReadResult.data && booksReadResult.data.length > 0) {
      booksRead = booksReadResult.data.map(item => ({
        ...item.books,
        completed_at: item.completed_at,
        user_book_id: item.id
      }))
    } else {
      // Fallback to localStorage
      try {
        const readIds = JSON.parse(localStorage.getItem('read') || '[]')
        if (readIds.length > 0) {
          const { data: booksData } = await supabase
            .from('books')
            .select('*')
            .in('id', readIds)
          
          if (booksData) {
            booksRead = booksData
          }
        }
      } catch (e) {
        console.error('Error fetching read books:', e)
      }
    }

    // Get currently reading
    let currentlyReading = []
    if (currentlyReadingResult.data && currentlyReadingResult.data.length > 0) {
      currentlyReading = currentlyReadingResult.data.map(item => ({
        ...item.books,
        current_page: item.current_page,
        progress: item.progress,
        user_book_id: item.id
      }))
    }

    // Get pinned books
    let pinnedBooks = []
    if (pinnedBooksResult.data && pinnedBooksResult.data.length > 0) {
      pinnedBooks = pinnedBooksResult.data.map(item => item.books)
    }

    // Calculate reading statistics
    const stats = calculateReadingStats(readingSessions, booksRead)
    
    // Calculate fresh data (always recalculate to ensure accuracy)
    const calculatedMonthlyProgress = calculateMonthlyProgress(readingSessions, booksRead)
    const calculatedGenreDistribution = calculateGenreDistribution(booksRead)
    
    // Check if saved data exists and matches calculated data
    const savedMonthlyProgress = monthlyProgressResult.data?.monthly_progress
    const savedGenrePreferences = genrePreferencesResult.data?.genre_preferences
    
    // Use saved data if it exists and matches, otherwise use calculated and save
    let monthlyProgress = calculatedMonthlyProgress
    let genreDistribution = calculatedGenreDistribution
    
    // Check if saved monthly progress is different (needs update)
    const monthlyProgressNeedsUpdate = !savedMonthlyProgress || 
      JSON.stringify(savedMonthlyProgress) !== JSON.stringify(calculatedMonthlyProgress)
    
    // Check if saved genre preferences are different (needs update)
    const genrePreferencesNeedUpdate = !savedGenrePreferences || 
      JSON.stringify(savedGenrePreferences) !== JSON.stringify(calculatedGenreDistribution)
    
    // Use saved data if it exists and is current
    if (savedMonthlyProgress && !monthlyProgressNeedsUpdate) {
      monthlyProgress = savedMonthlyProgress
    } else {
      // Save calculated data
      await saveMonthlyProgress(userId, calculatedMonthlyProgress)
    }
    
    if (savedGenrePreferences && !genrePreferencesNeedUpdate) {
      genreDistribution = savedGenrePreferences
    } else {
      // Save calculated data
      await saveGenrePreferences(userId, calculatedGenreDistribution)
    }
    
    // Calculate challenge data
    const challengeData = calculateChallengeData(booksRead)

    return {
      profile: profileResult.data,
      readingSessions,
      booksRead,
      currentlyReading,
      pinnedBooks,
      readingStats: stats,
      monthlyProgress,
      genreDistribution,
      challengeData
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return empty data structure on error
    return {
      profile: null,
      readingSessions: [],
      booksRead: [],
      currentlyReading: [],
      pinnedBooks: [],
      readingStats: {
        totalBooks: 0,
        totalPages: 0,
        activeDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageSession: 0,
        readingSpeed: 0,
        thisMonthBooks: 0,
        thisMonthPages: 0
      },
      monthlyProgress: [],
      genreDistribution: {},
      challengeData: {
        completed: 0,
        target: 52,
        percentage: 0,
        remaining: 52
      }
    }
  }
}

/**
 * Calculate reading statistics from sessions and books
 */
function calculateReadingStats(readingSessions, booksRead) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const yearStart = new Date(currentYear, 0, 1)
  const monthStart = new Date(currentYear, currentMonth, 1)

  // Filter sessions for current year
  const yearSessions = readingSessions.filter(session => {
    if (!session.date) return false
    const sessionDate = new Date(session.date)
    return sessionDate >= yearStart
  })

  // Filter sessions for current month
  const monthSessions = yearSessions.filter(session => {
    const sessionDate = new Date(session.date)
    return sessionDate >= monthStart
  })

  // Calculate active days
  const uniqueDays = new Set(yearSessions.map(s => s.date))
  const activeDays = uniqueDays.size

  // Calculate total pages
  const totalPages = yearSessions.reduce((sum, s) => sum + (s.pages || 0), 0)

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(readingSessions)

  // Calculate longest streak
  const longestStreak = calculateLongestStreak(readingSessions)

  // Calculate average session duration (in minutes)
  const totalSessionTime = yearSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const averageSession = yearSessions.length > 0 
    ? Math.round(totalSessionTime / yearSessions.length) 
    : 0

  // Calculate reading speed (pages per hour)
  const totalHours = totalSessionTime / 60
  const readingSpeed = totalHours > 0 
    ? Math.round(totalPages / totalHours) 
    : 0

  // This month stats
  const thisMonthBooks = booksRead.filter(book => {
    if (!book.completed_at) return false
    const completedDate = new Date(book.completed_at)
    return completedDate >= monthStart
  }).length

  const thisMonthPages = monthSessions.reduce((sum, s) => sum + (s.pages || 0), 0)

  return {
    totalBooks: booksRead.length,
    totalPages,
    activeDays,
    currentStreak,
    longestStreak,
    averageSession,
    readingSpeed,
    thisMonthBooks,
    thisMonthPages
  }
}

/**
 * Calculate current reading streak
 */
function calculateCurrentStreak(readingSessions) {
  if (readingSessions.length === 0) return 0

  const sortedSessions = [...readingSessions]
    .filter(s => s.date)
    .map(s => new Date(s.date).toISOString().split('T')[0])
    .sort((a, b) => b.localeCompare(a))

  if (sortedSessions.length === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let streak = 0
  let currentDate = sortedSessions.includes(today) ? today : yesterday

  for (const date of sortedSessions) {
    if (date === currentDate) {
      streak++
      const dateObj = new Date(currentDate)
      dateObj.setDate(dateObj.getDate() - 1)
      currentDate = dateObj.toISOString().split('T')[0]
    } else if (date < currentDate) {
      break
    }
  }

  return streak
}

/**
 * Calculate longest reading streak
 */
function calculateLongestStreak(readingSessions) {
  if (readingSessions.length === 0) return 0

  const sortedDates = [...new Set(readingSessions
    .filter(s => s.date)
    .map(s => new Date(s.date).toISOString().split('T')[0])
  )].sort((a, b) => a.localeCompare(b))

  if (sortedDates.length === 0) return 0

  let longestStreak = 1
  let currentStreak = 1

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1])
    const currDate = new Date(sortedDates[i])
    const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return longestStreak
}

/**
 * Calculate monthly progress data
 */
function calculateMonthlyProgress(readingSessions, booksRead) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentYear = new Date().getFullYear()
  const monthlyCounts = {}
  const monthlyPages = {}

  months.forEach(month => {
    monthlyCounts[month] = 0
    monthlyPages[month] = 0
  })

  // Count books by completion month
  booksRead.forEach(book => {
    if (book.completed_at) {
      const completedDate = new Date(book.completed_at)
      if (completedDate.getFullYear() === currentYear) {
        const monthIndex = completedDate.getMonth()
        const monthName = months[monthIndex]
        monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1
      }
    }
  })

  // Count pages by session month
  readingSessions.forEach(session => {
    if (session.date) {
      const sessionDate = new Date(session.date)
      if (sessionDate.getFullYear() === currentYear) {
        const monthIndex = sessionDate.getMonth()
        const monthName = months[monthIndex]
        monthlyPages[monthName] = (monthlyPages[monthName] || 0) + (session.pages || 0)
      }
    }
  })

  return months.map(month => ({
    month,
    books: monthlyCounts[month] || 0,
    pages: monthlyPages[month] || 0
  }))
}

/**
 * Calculate genre distribution
 */
function calculateGenreDistribution(booksRead) {
  const distribution = {}

  booksRead.forEach(book => {
    const subjects = book.subjects || []
    subjects.forEach(subject => {
      distribution[subject] = (distribution[subject] || 0) + 1
    })
  })

  return distribution
}

/**
 * Calculate challenge data
 */
function calculateChallengeData(booksRead) {
  const currentYear = new Date().getFullYear()
  const yearStart = new Date(currentYear, 0, 1)
  
  const completedThisYear = booksRead.filter(book => {
    if (!book.completed_at) return false
    const completedDate = new Date(book.completed_at)
    return completedDate >= yearStart
  }).length

  const target = 52 // Default annual target
  const percentage = Math.round((completedThisYear / target) * 100)
  const remaining = Math.max(0, target - completedThisYear)

  return {
    completed: completedThisYear,
    target,
    percentage,
    remaining
  }
}

/**
 * Save genre preferences to database
 * @param {string} userId - User ID
 * @param {object} genreDistribution - Genre distribution object
 */
export async function saveGenrePreferences(userId, genreDistribution) {
  if (!userId || !genreDistribution) return

  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        genre_preferences: genreDistribution,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving genre preferences:', error)
    }
  } catch (error) {
    console.error('Error saving genre preferences:', error)
  }
}

/**
 * Save monthly progress to database
 * @param {string} userId - User ID
 * @param {array} monthlyProgress - Monthly progress array
 */
export async function saveMonthlyProgress(userId, monthlyProgress) {
  if (!userId || !monthlyProgress) return

  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        monthly_progress: monthlyProgress,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving monthly progress:', error)
    }
  } catch (error) {
    console.error('Error saving monthly progress:', error)
  }
}

/**
 * Sync dashboard data - recalculate and save genre preferences and monthly progress
 * @param {string} userId - User ID
 * @param {array} readingSessions - Reading sessions
 * @param {array} booksRead - Books read
 */
export async function syncDashboardData(userId, readingSessions = [], booksRead = []) {
  if (!userId) return

  try {
    // Calculate fresh data
    const monthlyProgress = calculateMonthlyProgress(readingSessions, booksRead)
    const genreDistribution = calculateGenreDistribution(booksRead)

    // Save both in parallel
    await Promise.all([
      saveMonthlyProgress(userId, monthlyProgress),
      saveGenrePreferences(userId, genreDistribution)
    ])
  } catch (error) {
    console.error('Error syncing dashboard data:', error)
  }
}


import { supabase } from './supabaseClient'

/**
 * Check if user has completed personalization
 * @param {string} userId - User ID from auth
 * @returns {Promise<boolean>} - True if personalization is completed
 */
export async function hasCompletedPersonalization(userId) {
  if (!userId) return false
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('completed_at')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking personalization:', error)
      return false
    }
    
    return data && data.completed_at !== null
  } catch (error) {
    console.error('Error checking personalization:', error)
    return false
  }
}

/**
 * Get user profile data
 * @param {string} userId - User ID from auth
 * @returns {Promise<object|null>} - User profile data or null
 */
export async function getUserProfile(userId) {
  if (!userId) return null
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}


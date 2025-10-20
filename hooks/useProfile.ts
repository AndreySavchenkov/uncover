import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from './useUser'

export function useProfile() {
  const { user, loading: userLoading } = useUser()
  const [profile, setProfile] = useState<{ username?: string; age?: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, age')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)
      if (error) console.error(error)
      setLoading(false)
    }

    loadProfile()
  }, [user])

  return { profile, loading: loading || userLoading }
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1️⃣ Получаем текущего пользователя при монтировании
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data?.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    getUser()

    // 2️⃣ Подписываемся на изменения состояния (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // 3️⃣ Очищаем подписку при размонтировании
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

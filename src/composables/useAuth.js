import { computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

const CURRENT_USER = gql`
  query {
    currentUser {
      id
      email
      firstName
      role
    }
  }
`

export function useAuth() {
  const token = computed(() => localStorage.getItem('token'))

  const { result, loading, refetch } = useQuery(
    CURRENT_USER,
    {},
    {
      enabled: computed(() => !!token.value),
      fetchPolicy: 'network-only',
    }
  )

  
  const currentUser = computed(() => result.value?.currentUser || null)
  console.log(currentUser)

  return {
    currentUser,
    loading,
    refetch,
  }
}

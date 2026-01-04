<template>
  <div class="deck">
    <div class="header">
      <h1>MatchPoint</h1>
      <div class="nav">
        <router-link to="/matches">💬 Messages</router-link>
        <button @click="logout">Logout</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">Loading...</div>

    <!-- Swipe Deck -->
    <div v-else-if="deckUser" class="deck-container">
      <div class="card">
        <img
          :src="deckUser.primaryPhotoUrl || 'https://via.placeholder.com/400x500'"
        />

        <div class="card-info">
          <h2>{{ deckUser.firstName }}, {{ deckUser.age }}</h2>
          <p>{{ deckUser.city }}</p>
          <p v-if="deckUser.bio">{{ deckUser.bio }}</p>
        </div>

        <div class="actions">
          <button @click="swipe('dislike')" class="dislike">✕</button>
          <button @click="swipe('like')" class="like">♥</button>
        </div>
      </div>
    </div>

    <!-- No more users -->
    <div v-else class="no-more">
      <h2>No more users</h2>
      <p>Check back later!</p>
    </div>

    <!-- Match Modal -->
    <div v-if="showMatchModal" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>🎉 It's a Match!</h2>
        <p>You and {{ matchedUser?.firstName }} liked each other!</p>
        <button @click="goToMessages">Send Message</button>
        <button @click="closeModal">Keep Swiping</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()

/* ---------------- AUTH ---------------- */
const { currentUser: authUser, loading: authLoading } = useAuth()

/* ---------------- STATE ---------------- */
const currentIndex = ref(0)
const showMatchModal = ref(false)
const matchedUser = ref(null)

/* ---------------- GRAPHQL QUERIES ---------------- */
const SWIPE_DECK = gql`
  query SwipeDeck($limit: Int!) {
    swipeDeck(limit: $limit) {
      id
      firstName
      city
      bio
      primaryPhotoUrl
    }
  }
`

const CREATE_SWIPE = gql`
  mutation CreateSwipe($input: CreateSwipeInput!) {
    createSwipe(input: $input) {
      matched
      match {
        user1 { id firstName }
        user2 { id firstName }
      }
    }
  }
`

/* ---------------- APOLLO ---------------- */
const { result, loading, refetch } = useQuery(
  SWIPE_DECK,
  { limit: 20 },
  { enabled: computed(() => !!authUser.value), fetchPolicy: 'network-only' }
)

import { apolloClient } from '@/apollo'

const testQuery = async () => {
  const { data, errors } = await apolloClient.query({
    query: SWIPE_DECK,
    variables: { limit: 20 },
    fetchPolicy: 'network-only'
  })
  console.log('manual query result:', data, errors)
}

testQuery()

const { mutate: createSwipe } = useMutation(CREATE_SWIPE)

/* ---------------- COMPUTED ---------------- */
const users = computed(() => result.value?.swipeDeck ?? [])

console.log(users)

const deckUser = computed(() => {
  return users.value[currentIndex.value] || null
})

/* ---------------- ACTIONS ---------------- */
const swipe = async (action) => {
  if (!deckUser.value?.id || !authUser.value?.id) return

  try {
    const { data } = await createSwipe({
      input: {
        swipedId: deckUser.value.id,
        action,
      },
    })

    // If matched, show modal
    if (data?.createSwipe?.matched) {
      matchedUser.value =
        data.createSwipe.match.user1.id === authUser.value.id
          ? data.createSwipe.match.user2
          : data.createSwipe.match.user1
      showMatchModal.value = true
    }

    // Move to next card
    currentIndex.value++

    // Refetch if low on cards
    if (users.value.length - currentIndex.value < 3) {
      refetch()
    }
  } catch (e) {
    console.error('Swipe error:', e)
  }
}

const closeModal = () => {
  showMatchModal.value = false
  matchedUser.value = null
}

const goToMessages = () => {
  closeModal()
  router.push('/matches')
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.deck {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.nav {
  display: flex;
  gap: 10px;
}

.loading {
  text-align: center;
  padding: 50px;
}

.card {
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
}

.card img {
  width: 100%;
  height: 500px;
  object-fit: cover;
}

.card-info {
  padding: 20px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

button {
  padding: 15px 30px;
  font-size: 24px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  width: 60px;
  height: 60px;
}

.dislike {
  background: #ff4444;
  color: white;
}

.like {
  background: #44ff44;
  color: white;
}

.no-more {
  text-align: center;
  padding: 50px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
}

.modal-content button {
  margin: 10px;
  border-radius: 8px;
  width: auto;
  height: auto;
  font-size: 16px;
}
</style>

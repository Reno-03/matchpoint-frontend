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
      <div
        class="card"
        :style="cardStyle"
        @mousedown="onStart"
        @mousemove="onMove"
        @mouseup="onEnd"
        @mouseleave="dragging && onEnd()"
        @touchstart="onStart"
        @touchmove="onMove"
        @touchend="onEnd"
      >


        <!-- PHOTO GALLERY -->
        <div class="photo-wrapper" @click="nextPhoto">
          <img :src="deckUser.photos[photoIndex]" />

          <!-- dots -->
          <div class="photo-dots">
            <span
              v-for="(_, i) in deckUser.photos"
              :key="i"
              :class="{ active: i === photoIndex }"
            />
          </div>
        </div>

        <div class="card-info">
          <h2>{{ deckUser.firstName }} {{ deckUser.lastName }}</h2>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'
import { useAuth } from '@/composables/useAuth'

/* ---------------- ROUTER & AUTH ---------------- */
const router = useRouter()
const { currentUser: authUser } = useAuth()

/* ---------------- STATE ---------------- */
const currentIndex = ref(0)
const photoIndex = ref(0)
const showMatchModal = ref(false)
const matchedUser = ref(null)

const startX = ref(0)
const currentX = ref(0)
const dragging = ref(false)

/* ---------------- GRAPHQL ---------------- */
const SWIPE_DECK = gql`
  query SwipeDeck($limit: Int!) {
    swipeDeck(limit: $limit) {
      id
      firstName
      lastName
      city
      bio
      gender
      role
      photos {
        id
        url
        position
        isPrimary
      }
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
  {
    enabled: computed(() => !!authUser.value),
    fetchPolicy: 'network-only'
  }
)

const { mutate: createSwipe } = useMutation(CREATE_SWIPE)

/* ------ SWIPE FUNCTION --------- */
const onStart = (e) => {
  dragging.value = true
  startX.value = e.touches ? e.touches[0].clientX : e.clientX
}

const onMove = (e) => {
  if (!dragging.value) return
  currentX.value = (e.touches ? e.touches[0].clientX : e.clientX) - startX.value
}

const onEnd = async () => {
  dragging.value = false

  if (currentX.value > 120) {
    await swipe('like')
  } else if (currentX.value < -120) {
    await swipe('dislike')
  }

  currentX.value = 0
}

const cardStyle = computed(() => {
  const rotate = currentX.value / 12
  return {
    transform: `translateX(${currentX.value}px) rotate(${rotate}deg)`,
    transition: dragging.value ? 'none' : 'transform 0.3s ease'
  }
})


/* ---------------- COMPUTED ---------------- */
const users = computed(() => {
  const allUsers = result.value?.swipeDeck ?? []
  // Filter to only show users with role "user" (exclude admin and other roles)
  return allUsers.filter(user => user.role === 'user')
})

const deckUser = computed(() => {
  const user = users.value[currentIndex.value]
  if (!user) return null

  const defaultPhoto =
    user.gender === 'Female' ? '/girl.png' : '/boy.png'

  const photos =
    user.photos?.length
      ? user.photos
          .slice()
          .sort((a, b) => a.position - b.position)
          .map(p => p.url)
      : [defaultPhoto]

  return {
    ...user,
    photos
  }
})

/* Reset gallery when user changes */
watch(deckUser, () => {
  photoIndex.value = 0
})

/* ---------------- ACTIONS ---------------- */
const nextPhoto = () => {
  if (!deckUser.value) return
  photoIndex.value =
    (photoIndex.value + 1) % deckUser.value.photos.length
}

const swipe = async (action) => {
  if (!deckUser.value?.id || !authUser.value?.id) return

  try {
    const { data } = await createSwipe({
      input: {
        swipedId: deckUser.value.id,
        action
      }
    })

    if (data?.createSwipe?.matched) {
      matchedUser.value =
        data.createSwipe.match.user1.id === authUser.value.id
          ? data.createSwipe.match.user2
          : data.createSwipe.match.user1
      showMatchModal.value = true
    }

    currentIndex.value++
    photoIndex.value = 0

    if (currentIndex.value >= users.value.length) {
      await refetch()
      currentIndex.value = 0
    }
  } catch (e) {
    console.error('Swipe error:', e)
    currentIndex.value++
    photoIndex.value = 0
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

/* PHOTO GALLERY */
.photo-wrapper {
  position: relative;
  width: 100%;
  height: 500px;
  cursor: pointer;
}

.photo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.photo-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
}

.photo-dots span.active {
  background: white;
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
  padding: 15px;
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
  inset: 0;
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
}
.card {
  touch-action: pan-y;
  user-select: none;
}

.modal-content button {
  margin: 10px;
  border-radius: 8px;
  width: auto;
  height: auto;
  font-size: 16px;
}
</style>

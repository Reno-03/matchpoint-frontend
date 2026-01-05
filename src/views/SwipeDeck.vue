<template>
  <div class="deck">
    <div class="header">
      <div class="logo-wrapper">
        <img src="/icon.jpg" alt="MatchPoint Logo" class="logo" />
        <h1 class="app-name">MatchPoint</h1>
      </div>
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
  margin: 20px auto;
  padding: 0 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.nav {
  display: flex;
  gap: 10px;
}

.nav a {
  text-decoration: none;
  color: #ff7575;
  font-weight: 600;
  transition: color 0.2s ease;
}

.nav a:hover {
  color: #f97316;
}

.nav button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav button:hover {
  background: linear-gradient(135deg, #ff7575 0%, #ea580c 100%);
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #666;
}

/* CENTERED DECK CARD */
.deck-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 75vh; /* centers vertically */
}

.card {
  width: 90%;          /* fills most of small screens */
  max-width: 380px;    /* caps the size on larger screens */
  aspect-ratio: 0.66;  /* height = width / 0.66, gives nice portrait ratio */
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.09);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  touch-action: pan-y;
  user-select: none;
}

/* PHOTO GALLERY */
.photo-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* Aspect ratio: height/width = 1.3 (~portrait) */
  cursor: pointer;
  background: #f0f0f0;
  overflow: hidden;
}

.photo-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* ensures image fills container without distortion */
}

.photo-dots {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.photo-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.2s ease;
}

.photo-dots span.active {
  background: white;
}

/* CARD INFO */
.card-info {
  padding: 16px 20px;
  text-align: left;
}

.card-info h2 {
  font-size: 24px;
  margin: 0 0 4px 0;
  font-weight: 700;
}

.card-info p {
  margin: 4px 0;
  color: #555;
  font-size: 14px;
}

/* ACTION BUTTONS */
.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-bottom: 16px;
}

.actions button {
  width: 60px;
  height: 60px;
  font-size: 24px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.dislike {
  background: #ff4444;
}

.like {
  background: #44ff44;
}

/* NO MORE USERS */
.no-more {
  text-align: center;
  padding: 50px;
  font-size: 16px;
  color: #666;
}

.no-more h2 {
  font-size: 24px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* MATCH MODAL */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.modal-content h2 {
  font-size: 28px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-content p {
  font-size: 16px;
  color: #555;
  margin-bottom: 20px;
}

.modal-content button {
  padding: 12px 20px;
  font-size: 16px;
  border-radius: 8px;
  border: none;
  margin: 8px;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.modal-content button:hover {
  background: linear-gradient(135deg, #ff7575 0%, #ea580c 100%);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-wrapper .logo {
  width: 48px;     /* slightly smaller than login logo */
  height: 48px;
  border-radius: 12px;
  object-fit: contain;
}

.logo-wrapper .app-name {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
  margin: 0;
}


/* RESPONSIVE */
@media (max-width: 480px) {
  .deck {
    padding: 16px;
  }

  .header h1 {
    font-size: 28px;
  }

  .card {
    width: 280px;
    height: 440px;
  }

  .card-info h2 {
    font-size: 20px;
  }

  .actions button {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .photo-wrapper {
    height: auto;
  }
}

</style>
  
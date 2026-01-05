<template>
  <div class="matches">
    <div class="header">
      <router-link to="/deck">← Back to Deck</router-link>
      <h1>Messages</h1>
    </div>
    
    <div v-if="loading">Loading...</div>
    
    <div v-else-if="inbox.length === 0" class="empty">
      <p>No matches yet. Keep swiping!</p>
    </div>
    
    <div v-else class="inbox-list">
      <div 
        v-for="item in inbox" 
        :key="item.match.id"
        class="inbox-item"
        @click="openChat(item.match.id, item.otherUser)"
      >
        <img :src="item.otherUser.primaryPhotoUrl || (item.otherUser.gender === 'Female' ? '/girl.png' : '/boy.png')" />
        
        <div class="info">
          <h3>{{ item.otherUser.firstName }}</h3>
          <p>{{ item.latestMessage?.content || 'Say hi!' }}</p>
        </div>
        
        <span v-if="item.unreadCount > 0" class="unread">{{ item.unreadCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuery } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

const router = useRouter()
const route = useRoute()

/* ---------------- GRAPHQL ---------------- */
const MY_INBOX = gql`
  query MyInbox {
    myInbox {
      match { id }
      otherUser { id firstName gender primaryPhotoUrl }
      latestMessage { content createdAt }
      unreadCount
    }
  }
`

const { result, loading, refetch } = useQuery(MY_INBOX, null, {
  fetchPolicy: 'network-only'  // ← Always fetch from server, not cache
})
const inbox = computed(() => result.value?.myInbox || [])

/* ---------------- OPEN CHAT ---------------- */
const openChat = (matchId, otherUser) => {
  router.push({
    name: 'chat',
    params: { matchId },
    query: { userId: otherUser.id, name: otherUser.firstName }
  })
}

/* ---------------- REFRESH ON ROUTE ENTER ---------------- */
// watchEffect(() => {
//   // Whenever route changes, refetch inbox
//   refetch()
// })

// onMounted(() => {
//   refetch()
// })
</script>


<style scoped>
.matches {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.empty {
  text-align: center;
  padding: 50px;
}

.inbox-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
}

.inbox-item:hover {
  background: #f5f5f5;
}

.inbox-item img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.info {
  flex: 1;
}

.info h3 {
  margin: 0;
}

.info p {
  margin: 5px 0 0;
  color: #666;
}

.unread {
  background: #ff4444;
  color: white;
  padding: 5px 10px;
  border-radius: 50%;
  font-size: 12px;
}
</style>
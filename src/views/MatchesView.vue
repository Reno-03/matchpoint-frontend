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
          <h3>{{ item.otherUser.firstName }} {{ item.otherUser.lastName }}</h3>
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
      otherUser { id firstName lastName gender primaryPhotoUrl }
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
  margin: 20px auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.header a {
  text-decoration: none;
  color: #ff7575;
  font-weight: 600;
  transition: color 0.2s ease;
}

.header a:hover {
  color: #f97316;
}

.header h1 {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff7575 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: right;
  margin: 0;
  flex: 1;
}

.empty {
  text-align: center;
  padding: 50px;
  font-size: 16px;
  color: #666;
}

.inbox-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* INBOX ITEM */
.inbox-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.inbox-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.inbox-item img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #ff7575;
}

.info {
  flex: 1;
  text-align: left;
  min-width: 0 /* crucial for text-overflow */
}

.info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ff4444;
  color: white;
  padding: 4px 10px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

/* RESPONSIVE */
@media (max-width: 480px) {
  .matches {
    padding: 16px;
  }

  .header h1 {
    font-size: 28px;
  }

  .inbox-item img {
    width: 50px;
    height: 50px;
  }

  .info h3 {
    font-size: 14px;
  }

  .info p {
    font-size: 12px;
  }

  .unread {
    font-size: 10px;
    padding: 3px 8px;
  }
}
</style>
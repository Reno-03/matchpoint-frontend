<template>
  <div class="chat">
    <div class="header">
      <router-link to="/matches">← Back</router-link>
      
      <div class="other-user-info">
        <h2>{{ otherUserName }}</h2>
      </div>
    </div>

    <div class="messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message', msg.sender.id === currentUserId ? 'sent' : 'received']"
      >
        <!-- Avatar for received messages only -->
        <img 
          v-if="msg.sender.id !== currentUserId && msg.sender.primaryPhotoUrl" 
          :src="msg.sender.primaryPhotoUrl" 
          class="message-avatar" 
        />

        <div class="message-content">
          <p>{{ msg.content }}</p>
          <span class="time">{{ formatTime(msg.createdAt) }}</span>
        </div>
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="input-form">
      <input 
        v-model="newMessage" 
        placeholder="Type a message..." 
        :disabled="sending"
      />
      <button type="submit" :disabled="!newMessage.trim() || sending">
        Send
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'
import { useSubscription } from '@vue/apollo-composable'

const route = useRoute()
const newMessage = ref('')
const sending = ref(false)
const messagesContainer = ref(null)
const currentUserId = ref(null)

const matchId = route.params.matchId
const otherUserId = route.query.userId
const otherUserName = route.query.name


/* ---------------- GRAPHQL ---------------- */

const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription OnNewMessage($matchId: ID!) {
    newMessage(matchId: $matchId) {
      id
      content
      sender { id firstName lastName primaryPhotoUrl }
      receiver { id firstName lastName primaryPhotoUrl }
      createdAt
    }
  }
`

const CONVERSATION_MESSAGES = gql`
  query ConversationMessages($matchId: ID!) {
    conversationMessages(matchId: $matchId) {
      id
      content
      sender { id firstName lastName primaryPhotoUrl}
      receiver { id firstName lastName primaryPhotoUrl }
      read
      createdAt
    }
    currentUser { id }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      message { id content createdAt }
      errors
    }
  }
`

const MARK_AS_READ = gql`
  mutation MarkAsRead($input: MarkAsReadInput!) {
    markAsRead(input: $input) { 
      message { id read } 
      errors 
    }
  }
`

/* ---------------- QUERIES & MUTATIONS ---------------- */
const otherUser = computed(() => {
  if (!messages.value.length) return {
    fullName: otherUserName || '',
    photoUrl: '' // fallback
  }

  // Take the first message as reference
  const msg = messages.value[0]

  const user =
    msg.sender.id === currentUserId.value ? msg.receiver : msg.sender

  return {
    fullName: `${user.firstName} ${user.lastName}`,
    photoUrl: user.primaryPhotoUrl
  }
})

const { result: subResult } = useSubscription(NEW_MESSAGE_SUBSCRIPTION, { matchId })

watch(subResult, (val) => {
  if (!val) return
  messages.value.push(val.newMessage)
  scrollToBottom()
})

const { result, refetch } = useQuery(
  CONVERSATION_MESSAGES, 
  { matchId },
  { fetchPolicy: 'network-only' }  // ← Always get fresh messages
)

const { mutate: sendMessageMutation } = useMutation(SEND_MESSAGE)
const { mutate: markAsReadMutation } = useMutation(MARK_AS_READ)

const messages = computed(() => result.value?.conversationMessages || [])

/* ---------------- FUNCTIONS ---------------- */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  sending.value = true

  try {
    const { data } = await sendMessageMutation({
      input: {
        matchId: matchId,
        receiverId: otherUserId,
        content: newMessage.value
      }
    })

    if (!data.sendMessage.errors.length) {
      newMessage.value = ''
      await refetch()
      scrollToBottom()
    }
  } catch (e) {
    console.error('Send error:', e)
  } finally {
    sending.value = false
  }
}

const markUnreadMessages = async () => {
  if (!currentUserId.value) return
  
  const unreadMessages = messages.value.filter(
    msg => !msg.read && msg.receiver.id === currentUserId.value
  )

  for (const msg of unreadMessages) {
    try {
      await markAsReadMutation({ input: { messageId: msg.id } })
    } catch (e) {
      console.error('Mark as read error:', e)
    }
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/* ---------------- LIFECYCLE ---------------- */
// Set current user ID when data loads
watch(result, (val) => {
  if (val?.currentUser) {
    currentUserId.value = val.currentUser.id
    markUnreadMessages()
    scrollToBottom()
  }
})

// Initial load
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat {
  max-width: 600px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  border-bottom: 1px solid #ddd;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  align-items: flex-end;
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 12px;
  gap: 8px;
}

.sent {
  align-self: flex-end;
  background: #42b983;
  color: white;
  justify-content: flex-end;
}

.received {
  align-self: flex-start;
  background: #f0f0f0;
  justify-content: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.time {
  font-size: 11px;
  opacity: 0.7;
}

.input-form {
  display: flex;
  padding: 15px;
  border-top: 1px solid #ddd;
  gap: 10px;
}

.input-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
}

.input-form button {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.input-form button:disabled {
  background: #ccc;
}

.other-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.other-user-info .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content p {
  margin: 0;
}

.message-content .time {
  font-size: 11px;
  opacity: 0.7;
  align-self: flex-end; /* pushes timestamp to the right in the bubble */
}
</style>

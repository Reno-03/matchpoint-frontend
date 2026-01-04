<template>
  <div class="chat">
    <div class="header">
      <router-link to="/matches">← Back</router-link>
      <h2>{{ otherUserName }}</h2>
    </div>

    <div class="messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message', msg.sender.id === currentUserId ? 'sent' : 'received']"
      >
        <p>{{ msg.content }}</p>
        <span class="time">{{ formatTime(msg.createdAt) }}</span>
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
import { ref, computed, watchEffect, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'

const route = useRoute()
const newMessage = ref('')
const sending = ref(false)
const messagesContainer = ref(null)
const currentUserId = ref(null)

const matchId = ref(route.params.matchId)
const otherUserId = ref(route.query.userId)
const otherUserName = ref(route.query.name)
const readMessageIds = ref(new Set())

/* ---------------- GRAPHQL ---------------- */
const CONVERSATION_MESSAGES = gql`
  query ConversationMessages($matchId: ID!) {
    conversationMessages(matchId: $matchId) {
      id
      content
      sender { id firstName }
      receiver { id firstName }
      read
      createdAt
    }
    currentUser { id }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      message { id content createdAt sender { id firstName } receiver { id firstName } read }
      errors
    }
  }
`

const MARK_AS_READ = gql`
  mutation MarkAsRead($input: MarkAsReadInput!) {
    markAsRead(input: $input) { message { id read } errors }
  }
`

/* ---------------- FUNCTIONS ---------------- */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  sending.value = true

  try {
    const { data } = await sendMessageMutation({
      input: {
        matchId: matchId.value,
        receiverId: otherUserId.value,
        content: newMessage.value
      }
    })

    if (!data.sendMessage.errors.length) {
      newMessage.value = ''
      refetch({ matchId: matchId.value })
    }
  } catch (e) {
    console.error('Send error:', e)
  } finally {
    sending.value = false
  }
}

const markAsRead = async (messageId) => {
  try {
    await markAsReadMutation({ input: { messageId } })
  } catch (e) {
    console.error('Mark as read error:', e)
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/* ---------------- QUERIES & MUTATIONS ---------------- */
const { result, refetch } = useQuery(CONVERSATION_MESSAGES, { matchId: matchId.value })
const { mutate: sendMessageMutation } = useMutation(SEND_MESSAGE)
const { mutate: markAsReadMutation } = useMutation(MARK_AS_READ)

const messages = computed(() => result.value?.conversationMessages || [])

watchEffect(() => {
  // update route params if changed
  matchId.value = route.params.matchId
  otherUserId.value = route.query.userId
  otherUserName.value = route.query.name

  if (matchId.value) {
    refetch({ matchId: matchId.value }).then(() => scrollToBottom())
    readMessageIds.value.clear()
  }
})

watchEffect(() => {
  if (!result.value) return
  currentUserId.value = result.value.currentUser.id

  // mark unread messages as read only once
  messages.value.forEach(msg => {
    if (!msg.read && msg.receiver.id === currentUserId.value && !readMessageIds.value.has(msg.id)) {
      markAsRead(msg.id)
      readMessageIds.value.add(msg.id)
    }
  })

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
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 12px;
}

.sent {
  align-self: flex-end;
  background: #42b983;
  color: white;
}

.received {
  align-self: flex-start;
  background: #f0f0f0;
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
</style>

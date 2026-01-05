<template>
    <div class="admin">
      <div class="header">
        <h1>Admin Dashboard</h1>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
      
      <div v-if="loading">Loading...</div>
      
      <div v-else-if="stats" class="dashboard">
        <div class="stats">
          <div class="stat-card">
            <h3>Total Users</h3>
            <p>{{ stats.totalUsers }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Total Matches</h3>
            <p>{{ stats.totalMatches }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Total Swipes</h3>
            <p>{{ stats.totalSwipes }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Total Messages</h3>
            <p>{{ stats.totalMessages }}</p>
          </div>
        </div>
        
        <div class="popular-users">
          <h2>Most Popular Users</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Likes Received</th>
                <th>Matches</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in stats.popularUsers" :key="item.user.id">
                <td>{{ item.user.firstName }}</td>
                <td>{{ item.likesReceived }}</td>
                <td>{{ item.matchesCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="users-section">
          <h2>All Users</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>City</th>
                <th>Matches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.city }}</td>
                <td>{{ user.matchesCount }}</td>
                <td>
                  <button @click="deleteUser(user.id)" class="delete-btn">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useQuery, useMutation } from '@vue/apollo-composable'
  import { gql } from '@apollo/client/core'
  
  const router = useRouter()
  
  const DASHBOARD_STATS = gql`
    query DashboardStats {
      dashboardStats(popularLimit: 10) {
        totalUsers
        totalMatches
        totalSwipes
        totalMessages
        popularUsers {
          user {
            id
            firstName
          }
          likesReceived
          matchesCount
        }
      }
      allUsers(limit: 50) {
        id
        firstName
        lastName
        email
        city
        matchesCount
      }
    }
  `
  
  const DELETE_USER = gql`
    mutation DeleteUser($input: DeleteUserInput!) {
      deleteUser(input: $input) {
        success
        errors
      }
    }
  `
  
  const { result, loading, refetch } = useQuery(DASHBOARD_STATS)
  const { mutate: deleteUserMutation } = useMutation(DELETE_USER)
  
  const stats = computed(() => result.value?.dashboardStats)
  const users = computed(() => result.value?.allUsers || [])
  
  const deleteUser = async (userId) => {
    if (!confirm('Are you sure?')) return
    
    try {
      await deleteUserMutation({
        input: { userId }
      })
      refetch()
    } catch (e) {
      alert('Error deleting user: ' + e.message)
    }
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }
  </script>
  
  <style scoped>
  .admin {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .logout-btn {
    background: #ff7575;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background 0.2s ease;
  }
  
  .logout-btn:hover {
    background: #ff4444;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .stat-card {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: center;
  }
  
  .stat-card h3 {
    margin: 0 0 10px;
    font-size: 14px;
    color: #666;
  }
  
  .stat-card p {
    margin: 0;
    font-size: 32px;
    font-weight: bold;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  th {
    background: #f5f5f5;
    font-weight: bold;
  }
  
  .delete-btn {
    background: #ff4444;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .popular-users, .users-section {
    margin-top: 40px;
  }
  </style>
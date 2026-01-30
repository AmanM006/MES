import axios from 'axios';

const apiClient = axios.create({
  // 👇 CRITICAL: Must point to your Backend Port (8080), not Frontend (3000)
  baseURL: 'http://localhost:8080', 
  
  // 👇 CRITICAL: Allows cookies to be sent/received (for your JWT)
  withCredentials: true, 
  
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
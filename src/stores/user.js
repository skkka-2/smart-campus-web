import { defineStore } from 'pinia';

const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    userID: localStorage.getItem('userID') || null,
    username: localStorage.getItem('username') || null,
  }),

  getters: {
    /** 是否已登录 */
    isLogin: (state) => !!state.token,
  },

  actions: {
    /**
     * 登录成功后一并回填
     * @param {{ token: string, user: { id: number|string, username: string } }} payload
     */
    setSession({ token, user }) {
      this.token = token;
      this.userID = user?.id ?? null;
      this.username = user?.username ?? null;
      localStorage.setItem('token', token);
      if (this.userID != null) localStorage.setItem('userID', String(this.userID));
      if (this.username) localStorage.setItem('username', this.username);
    },

    setToken(token) {
      this.token = token;
      localStorage.setItem('token', token);
    },
    clearToken() {
      this.token = null;
      localStorage.removeItem('token');
    },

    setID(userID) {
      this.userID = userID;
      localStorage.setItem('userID', String(userID));
    },
    clearID() {
      this.userID = null;
      localStorage.removeItem('userID');
    },

    logout() {
      this.token = null;
      this.userID = null;
      this.username = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userID');
      localStorage.removeItem('username');
    },
  },
});

export default useUserStore;

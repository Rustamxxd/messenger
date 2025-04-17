import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  avatar: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAvatar: (state, action) => {
      state.avatar = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.avatar = null;
    },
  },
});

export const { setUser, setAvatar, logout } = userSlice.actions;
export default userSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  loading: true,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        const { displayName, photoURL, bio } = action.payload;
        state.user.displayName = displayName ?? state.user.displayName;
        state.user.photoURL = photoURL ?? state.user.photoURL;
        state.user.bio = bio ?? state.user.bio;
      }
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, updateUserProfile, logout } = userSlice.actions;
export default userSlice.reducer;
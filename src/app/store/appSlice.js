import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chatOpen: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setChatOpen(state, action) {
      state.chatOpen = action.payload;
    },
  },
});

export const { setChatOpen } = appSlice.actions;
export default appSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chats: [],
  activeChatId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats(state, action) {
      state.chats = action.payload;
    },
    addChat(state, action) {
      state.chats.push(action.payload);
    },
    setActiveChat(state, action) {
      state.activeChatId = action.payload;
    },
    removeChat(state, action) {
      state.chats = state.chats.filter(chat => chat.id !== action.payload);
    },
  },
});

export const { setChats, addChat, setActiveChat, removeChat } = chatSlice.actions;

export default chatSlice.reducer;
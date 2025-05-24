import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setMessages(state, action) {
      state.messages = action.payload;
    },
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    removeMessage(state, action) {
      state.messages = state.messages.filter(message => message.id !== action.payload);
    },
    updateMessage(state, action) {
      const index = state.messages.findIndex(message => message.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
  },
});

export const { setMessages, addMessage, removeMessage, updateMessage } = messageSlice.actions;

export default messageSlice.reducer;
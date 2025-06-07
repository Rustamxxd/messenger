import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const initialState = {
  list: [],
  currentGroup: null,
};

export const loadGroupById = createAsyncThunk(
  "groups/loadGroupById",
  async (id, { rejectWithValue }) => {
    try {
      const ref = doc(db, "chats", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Group not found");
      return { id, ...snap.data() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGroupProfile = createAsyncThunk(
  "groups/updateGroupProfile",
  async ({ id, name, description, photoURL }, { rejectWithValue }) => {
    try {
      const groupRef = doc(db, "chats", id);
      const updateData = { name, description, photoURL };
      await updateDoc(groupRef, updateData);
      return { id, ...updateData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeGroupMember = createAsyncThunk(
  "groups/removeGroupMember",
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      const groupRef = doc(db, "chats", groupId);
      const snap = await getDoc(groupRef);
      if (!snap.exists()) throw new Error("Group not found");
      const data = snap.data();
      const updatedMembers = data.members.filter((m) => m.id !== userId);
      await updateDoc(groupRef, { members: updatedMembers });
      return { id: groupId, members: updatedMembers };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const promoteGroupMember = createAsyncThunk(
  "groups/promoteGroupMember",
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      const groupRef = doc(db, "chats", groupId);
      const snap = await getDoc(groupRef);
      if (!snap.exists()) throw new Error("Group not found");
      const data = snap.data();
      const updatedMembers = data.members.map((m) =>
        m.id === userId ? { ...m, role: "admin" } : m
      );
      await updateDoc(groupRef, { members: updatedMembers });
      return { id: groupId, members: updatedMembers };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    setGroups(state, action) {
      state.list = action.payload;
    },
    setCurrentGroup(state, action) {
      state.currentGroup = action.payload;
    },
    updateGroup(state, action) {
      const updatedGroup = action.payload;
      const index = state.list.findIndex((g) => g.id === updatedGroup.id);
      if (index !== -1) {
        state.list[index] = updatedGroup;
      }
      if (state.currentGroup?.id === updatedGroup.id) {
        state.currentGroup = updatedGroup;
      }
    },
    updateGroupField(state, action) {
      const { field, value } = action.payload;
      if (state.currentGroup) {
        state.currentGroup[field] = value;
      }
    },
    updateGroupMembers(state, action) {
      if (state.currentGroup) {
        state.currentGroup.members = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGroupById.fulfilled, (state, action) => {
        const group = action.payload;
        const exists = state.list.find((g) => g.id === group.id);
        if (!exists) {
          state.list.push(group);
        }
      })
      .addCase(updateGroupProfile.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.list.findIndex((g) => g.id === updated.id);
        if (index !== -1) state.list[index] = { ...state.list[index], ...updated };
        if (state.currentGroup?.id === updated.id) {
          state.currentGroup = { ...state.currentGroup, ...updated };
        }
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        const { id, members } = action.payload;
        const group = state.list.find((g) => g.id === id);
        if (group) group.members = members;
        if (state.currentGroup?.id === id) {
          state.currentGroup.members = members;
        }
      })
      .addCase(promoteGroupMember.fulfilled, (state, action) => {
        const { id, members } = action.payload;
        const group = state.list.find((g) => g.id === id);
        if (group) group.members = members;
        if (state.currentGroup?.id === id) {
          state.currentGroup.members = members;
        }
      });
  },
});

export const {
  setGroups,
  setCurrentGroup,
  updateGroup,
  updateGroupField,
  updateGroupMembers,
} = groupSlice.actions;

export default groupSlice.reducer;
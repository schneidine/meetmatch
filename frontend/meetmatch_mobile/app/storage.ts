import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatThread, MatchedPerson, EventSummary } from "./types";

// Utility keys (optionally make them user-specific by appending userId)
const MATCHED_HISTORY_KEY = "matchedHistory";
const INTERESTED_EVENTS_KEY = "interestedEvents";
const CHAT_THREADS_KEY = "chatThreads";

// Matched People
export async function saveMatchedHistory(history: MatchedPerson[], userId: string | number) {
  await AsyncStorage.setItem(`${MATCHED_HISTORY_KEY}_${userId}`, JSON.stringify(history));
}
export async function loadMatchedHistory(userId: string | number): Promise<MatchedPerson[]> {
  const data = await AsyncStorage.getItem(`${MATCHED_HISTORY_KEY}_${userId}`);
  return data ? JSON.parse(data) : [];
}

// Interested Events
export async function saveInterestedEvents(events: EventSummary[], userId: string | number) {
  await AsyncStorage.setItem(`${INTERESTED_EVENTS_KEY}_${userId}`, JSON.stringify(events));
}
export async function loadInterestedEvents(userId: string | number): Promise<EventSummary[]> {
  const data = await AsyncStorage.getItem(`${INTERESTED_EVENTS_KEY}_${userId}`);
  return data ? JSON.parse(data) : [];
}

// Chat Threads
export async function saveChatThreads(threads: ChatThread[], userId: string | number) {
  await AsyncStorage.setItem(`${CHAT_THREADS_KEY}_${userId}`, JSON.stringify(threads));
}
export async function loadChatThreads(userId: string | number): Promise<ChatThread[]> {
  const data = await AsyncStorage.getItem(`${CHAT_THREADS_KEY}_${userId}`);
  return data ? JSON.parse(data) : [];
}
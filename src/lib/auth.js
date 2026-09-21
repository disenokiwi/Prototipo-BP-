import { supabase } from "./supabaseClient.js";

let currentUser = null; // { id, email }
let currentProfile = null; // { id, full_name, role }
const listeners = new Set();

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn({ user: currentUser, profile: currentProfile });
}

export function getUser() {
  return currentUser;
}

export function getProfile() {
  return currentProfile;
}

export function isAdmin() {
  return currentProfile?.role === "administrador";
}

async function loadProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    console.error("No se pudo cargar el perfil:", error.message);
    return null;
  }
  return data;
}

export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    currentUser = data.session.user;
    currentProfile = await loadProfile(currentUser.id);
  }
  notify();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    currentProfile = currentUser ? await loadProfile(currentUser.id) : null;
    notify();
  });
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

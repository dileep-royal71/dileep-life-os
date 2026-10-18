import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Activity, Apple, ArrowLeft, ArrowRight, BarChart3, Bell, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  Dumbbell, Download, Droplets, Flame, GraduationCap, LayoutDashboard, LogOut, Menu, Moon,
  Plus, Search, Settings, ShieldAlert, Sun, Target, Trash2, TrendingDown, Trophy,
  Weight, X,
} from 'lucide-react'
import './App.css'
import AuthScreen from './AuthScreen'
import { supabase } from './lib/supabase'
import type { Json } from './lib/database.types'

type Page = 'Overview' | 'Schedule' | 'Calendar' | 'Training' | 'Weight' | 'Nutrition' | 'Learning' | 'SSC CGL' | 'Reports' | 'Settings'
type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Skipped'
type ActivityItem = { id: string; title: string; category: string; start: string; end: string; status: Status; notes: string; reminder: boolean; startedAt?: string; completedAt?: string }
type FoodItem = { id: string; name: string; meal: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; fibre: number; baseQuantity: number; baseCalories: number; baseProtein: number; baseCarbs: number; baseFat: number; baseFibre: number; state: string; consumed: boolean }
type WeightEntry = { id: string; date: string; weight: number; waist?: number; notes: string }
type Log = { id: string; date: string; label: string; minutes: number; count?: number; correct?: number; notes?: string }
type AppData = {
  profile: { name: string; dob: string; startWeight: number; goalWeight: number; timezone: string; waterGoal: number; calorieGoal: number; proteinGoal: number; theme: 'dark' | 'light' }
  templates: Omit<ActivityItem, 'status' | 'notes' | 'reminder' | 'startedAt' | 'completedAt'>[]
  activities: Record<string, ActivityItem[]>
  weights: WeightEntry[]
  foods: Record<string, FoodItem[]>
  water: Record<string, { id: string; time: string; ml: number }[]>
  completedTopics: string[]
  studyLogs: Log[]
  examLogs: Log[]
  mocks: { id: string; date: string; score: number; total: number }[]
  setLogs: Record<string, boolean[]>
  finishedWorkouts: string[]
}

const KEY = 'dileep-life-os-v1'
const NAV: { name: Page; icon: typeof Activity }[] = [
  { name: 'Overview', icon: LayoutDashboard }, { name: 'Schedule', icon: Clock3 },
  { name: 'Calendar', icon: CalendarDays }, { name: 'Training', icon: Dumbbell },
  { name: 'Weight', icon: Weight }, { name: 'Nutrition', icon: Apple },
  { name: 'Learning', icon: GraduationCap }, { name: 'SSC CGL', icon: Target },
  { name: 'Reports', icon: BarChart3 }, { name: 'Settings', icon: Settings },
]

const initialTemplates: AppData['templates'] = [
  { id: 'wake', title: 'Wake up & hydrate', category: 'Personal', start: '05:00', end: '05:30' },
  { id: 'breakfast', title: 'Breakfast / pre-workout', category: 'Nutrition', start: '05:30', end: '06:00' },
  { id: 'gym', title: 'Gym workout', category: 'Fitness', start: '06:00', end: '08:00' },
  { id: 'meal-prep', title: 'Prepare meals & organize food', category: 'Nutrition', start: '08:00', end: '11:00' },
  { id: 'recovery', title: 'Rest & recovery', category: 'Personal', start: '11:00', end: '12:00' },
  { id: 'tech', title: 'Python / SQL learning', category: 'Technical learning', start: '12:00', end: '14:00' },
  { id: 'lunch', title: 'Lunch & personal break', category: 'Nutrition', start: '14:00', end: '15:30' },
  { id: 'nap', title: 'Afternoon rest', category: 'Personal', start: '15:30', end: '16:30' },
  { id: 'refresh', title: 'Refresh', category: 'Personal', start: '16:30', end: '17:00' },
  { id: 'walk', title: 'Walking & daily activity', category: 'Fitness', start: '17:00', end: '20:00' },
  { id: 'exam', title: 'SSC CGL preparation', category: 'Exam preparation', start: '20:00', end: '23:00' },
  { id: 'sleep', title: 'Sleep', category: 'Personal', start: '23:00', end: '23:59' },
]

const pythonTopics = ['Python fundamentals', 'Variables and data types', 'Operators', 'Conditionals', 'Loops', 'Strings', 'Lists, tuples, sets & dictionaries', 'Functions', 'Recursion', 'Object-oriented programming', 'Exceptions', 'File handling', 'Modules & packages', 'Iterators & generators', 'Data structures & algorithms', 'Problem-solving practice', 'NumPy & Pandas', 'Mini-projects']
const sqlTopics = ['Database fundamentals', 'SELECT and WHERE', 'ORDER BY and DISTINCT', 'Aggregate functions', 'GROUP BY and HAVING', 'Joins', 'Subqueries', 'Common table expressions', 'CASE expressions', 'Constraints and keys', 'Normalization', 'Indexes', 'Views', 'Window functions', 'Query optimization', 'Interview practice']
const subjects = ['Quantitative Aptitude', 'General Intelligence & Reasoning', 'English Comprehension', 'General Awareness']
type WorkoutExercise = { name: string; group: string; target: string; sets: number; reps: string; rest: string }
type WorkoutDay = { day: number; label: string; title: string; focus: string; exercises: WorkoutExercise[]; isRest?: boolean }
const workoutSplit: WorkoutDay[] = [
  { day: 0, label: 'Sun', title: 'Rest & recovery', focus: 'Full-body recovery', isRest: true, exercises: [] },
  { day: 1, label: 'Mon', title: 'Push A', focus: 'Upper chest · mid chest · front/side delts · triceps', exercises: [
    { name: 'Incline dumbbell press', group: 'Chest', target: 'Upper chest', sets: 3, reps: '6–10', rest: '2 min' },
    { name: 'Barbell bench press', group: 'Chest', target: 'Mid chest', sets: 3, reps: '6–10', rest: '2–3 min' },
    { name: 'Cable fly', group: 'Chest', target: 'Chest adduction', sets: 2, reps: '10–15', rest: '60–90 sec' },
    { name: 'Seated dumbbell shoulder press', group: 'Shoulders', target: 'Front delts', sets: 3, reps: '8–12', rest: '90 sec' },
    { name: 'Dumbbell lateral raises', group: 'Shoulders', target: 'Side delts', sets: 3, reps: '12–20', rest: '60 sec' },
    { name: 'Rope triceps pushdown', group: 'Triceps', target: 'Lateral/medial triceps', sets: 3, reps: '10–15', rest: '60 sec' },
  ] },
  { day: 2, label: 'Tue', title: 'Pull A', focus: 'Lats · mid-back · rear delts · biceps · brachialis', exercises: [
    { name: 'Lat pulldown', group: 'Back', target: 'Lats / upper back', sets: 3, reps: '8–12', rest: '90 sec' },
    { name: 'Chest-supported row', group: 'Back', target: 'Rhomboids / mid traps', sets: 3, reps: '8–12', rest: '90 sec' },
    { name: 'Face pulls', group: 'Shoulders', target: 'Rear delts / upper back', sets: 3, reps: '12–20', rest: '60 sec' },
    { name: 'Incline dumbbell curls', group: 'Biceps', target: 'Biceps long head', sets: 3, reps: '8–12', rest: '60 sec' },
    { name: 'Hammer curls', group: 'Biceps', target: 'Brachialis / forearms', sets: 3, reps: '10–15', rest: '60 sec' },
    { name: 'Wrist curls', group: 'Forearms', target: 'Forearm flexors', sets: 2, reps: '12–20', rest: '45–60 sec' },
  ] },
  { day: 3, label: 'Wed', title: 'Legs A', focus: 'Quads · hamstrings · calves · anterior core', exercises: [
    { name: 'Barbell squat / alternative', group: 'Legs', target: 'Quads / glutes', sets: 3, reps: '6–10', rest: '2–3 min' },
    { name: 'Romanian deadlift', group: 'Legs', target: 'Hamstrings / glutes', sets: 3, reps: '8–12', rest: '2 min' },
    { name: 'Leg extension', group: 'Legs', target: 'Quadriceps', sets: 3, reps: '10–15', rest: '60–90 sec' },
    { name: 'Seated leg curl', group: 'Legs', target: 'Hamstrings', sets: 3, reps: '10–15', rest: '60–90 sec' },
    { name: 'Standing calf raises', group: 'Calves', target: 'Gastrocnemius', sets: 3, reps: '10–15', rest: '60 sec' },
    { name: 'Plank', group: 'Core', target: 'Abdominals / trunk stability', sets: 3, reps: '30–60 sec', rest: '45–60 sec' },
  ] },
  { day: 4, label: 'Thu', title: 'Push B', focus: 'Mid/lower chest · side delts · triceps long head', exercises: [
    { name: 'Machine chest press', group: 'Chest', target: 'Mid chest', sets: 3, reps: '8–12', rest: '90 sec' },
    { name: 'Assisted dips', group: 'Chest', target: 'Lower chest / triceps', sets: 3, reps: '8–12', rest: '90 sec' },
    { name: 'Push-ups', group: 'Chest', target: 'Chest / serratus', sets: 2, reps: 'Near technical failure', rest: '60 sec' },
    { name: 'Dumbbell lateral raises', group: 'Shoulders', target: 'Side delts', sets: 3, reps: '12–20', rest: '60 sec' },
    { name: 'Overhead cable extension', group: 'Triceps', target: 'Triceps long head', sets: 3, reps: '10–15', rest: '60 sec' },
    { name: 'Rope triceps pushdown', group: 'Triceps', target: 'Lateral/medial triceps', sets: 2, reps: '12–15', rest: '60 sec' },
  ] },
  { day: 5, label: 'Fri', title: 'Pull B', focus: 'Lats · traps · rear delts · biceps · forearms', exercises: [
    { name: 'One-arm dumbbell row', group: 'Back', target: 'Lats / mid-back', sets: 3, reps: '8–12 each side', rest: '90 sec' },
    { name: 'Seated cable row', group: 'Back', target: 'Rhomboids / mid traps', sets: 3, reps: '8–12', rest: '90 sec' },
    { name: 'Straight-arm pulldown', group: 'Back', target: 'Lats', sets: 2, reps: '12–15', rest: '60 sec' },
    { name: 'Reverse pec-deck fly', group: 'Shoulders', target: 'Rear delts', sets: 3, reps: '12–20', rest: '60 sec' },
    { name: 'Cable curls', group: 'Biceps', target: 'Biceps', sets: 3, reps: '10–15', rest: '60 sec' },
    { name: 'Dumbbell curls', group: 'Biceps', target: 'Biceps / forearms', sets: 2, reps: '10–15', rest: '60 sec' },
  ] },
  { day: 6, label: 'Sat', title: 'Legs B', focus: 'Quads · glutes · hamstrings · calves · full core', exercises: [
    { name: 'Leg press', group: 'Legs', target: 'Quads / glutes', sets: 3, reps: '8–12', rest: '2 min' },
    { name: 'Bulgarian split squat', group: 'Legs', target: 'Quads / glutes / adductors', sets: 3, reps: '8–12 each side', rest: '90 sec' },
    { name: 'Hip thrust', group: 'Glutes', target: 'Glute max', sets: 3, reps: '8–12', rest: '90 sec' },
    { name: 'Seated leg curl', group: 'Legs', target: 'Hamstrings', sets: 3, reps: '10–15', rest: '60–90 sec' },
    { name: 'Seated calf raises', group: 'Calves', target: 'Soleus', sets: 3, reps: '12–20', rest: '60 sec' },
    { name: 'Hanging knee raises', group: 'Core', target: 'Lower abs / hip flexors', sets: 3, reps: '8–15', rest: '60 sec' },
    { name: 'Dead bug', group: 'Core', target: 'Deep core / anti-extension', sets: 2, reps: '8–12 each side', rest: '45 sec' },
  ] },
]
const exercises = [...new Map(workoutSplit.flatMap(day => day.exercises).map(exercise => [exercise.name, exercise] as const)).values()]

function localDate(timezone: string) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  }
}
function makeDay(templates: AppData['templates']): ActivityItem[] {
  return templates.map(item => ({ ...item, status: 'Not Started', notes: '', reminder: false }))
}
function defaults(): AppData {
  return {
    profile: { name: 'Demo User', dob: '', startWeight: 80, goalWeight: 65, timezone: 'Asia/Kolkata', waterGoal: 2500, calorieGoal: 1800, proteinGoal: 150, theme: 'dark' },
    templates: initialTemplates, activities: {}, weights: [], foods: {}, water: {}, completedTopics: [], studyLogs: [], examLogs: [], mocks: [], setLogs: {}, finishedWorkouts: [],
  }
}
function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function isAppData(value: unknown): value is AppData {
  return isJsonRecord(value)
    && isJsonRecord(value.profile)
    && typeof value.profile.name === 'string'
    && Array.isArray(value.templates)
    && isJsonRecord(value.activities)
    && isJsonRecord(value.foods)
    && isJsonRecord(value.water)
    && Array.isArray(value.weights)
    && Array.isArray(value.completedTopics)
    && Array.isArray(value.studyLogs)
    && Array.isArray(value.examLogs)
    && Array.isArray(value.mocks)
    && isJsonRecord(value.setLogs)
    && Array.isArray(value.finishedWorkouts)
}
function normalizeData(value: unknown, userName: string): AppData {
  const initial = defaults()
  if (!isAppData(value)) return { ...initial, profile: { ...initial.profile, name: userName || initial.profile.name } }
  return {
    ...initial,
    ...value,
    profile: { ...initial.profile, ...value.profile, name: value.profile.name || userName || initial.profile.name },
  }
}
function useAppData(userId: string, userName: string) {
  const [data, setData] = useState<AppData>(() => ({ ...defaults(), profile: { ...defaults().profile, name: userName || 'Demo User' } }))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [saveError, setSaveError] = useState('')
  const [migrationPending, setMigrationPending] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [saveToken, setSaveToken] = useState(0)
  const canSave = useRef(false)
  const legacyData = useRef<AppData | null>(null)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const revision = useRef(0)
  const enqueueSave = useCallback((write: () => Promise<void>) => {
    const next = saveQueue.current.then(write)
    saveQueue.current = next.catch(() => undefined)
    return next
  }, [])

  useEffect(() => {
    let cancelled = false
    canSave.current = false

    const load = async () => {
      if (!supabase) {
        setLoadError('Cloud storage is not configured. Add the Supabase project URL and publishable key, then rebuild.')
        setLoading(false)
        return
      }
      try {
        const { data: record, error } = await supabase
          .from('user_life_os_data')
          .select('data')
          .eq('user_id', userId)
          .maybeSingle()
        if (error) throw error
        if (cancelled) return

        if (record) {
          setData(normalizeData(record.data, userName))
          canSave.current = true
        } else {
          let imported: AppData | null = null
          try {
            const local = localStorage.getItem(KEY)
            if (local) {
              const parsed: unknown = JSON.parse(local)
              if (isAppData(parsed)) imported = parsed
            }
          } catch (cause) {
            console.error('Could not inspect legacy browser data for optional import', cause)
          }
          legacyData.current = imported
          setData({ ...defaults(), profile: { ...defaults().profile, name: userName || 'Demo User' } })
          if (imported) setMigrationPending(true)
          else canSave.current = true
        }
      } catch (cause) {
        console.error('Could not load account data', cause)
        if (!cancelled) setLoadError(cause instanceof Error ? cause.message : 'Could not load your saved data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [userId, userName, reloadToken])

  useEffect(() => {
    if (loading || migrationPending || !canSave.current || !supabase) return
    const currentRevision = ++revision.current
    setSaveStatus('saving')
    setSaveError('')
    const timer = window.setTimeout(() => {
      const serialized = JSON.stringify(data)
      const payload = JSON.parse(serialized) as Json
      const nextSave = enqueueSave(async () => {
        if (!supabase) throw new Error('Cloud storage is not configured.')
        const { error } = await supabase.from('user_life_os_data').upsert({
          user_id: userId,
          data: payload,
          updated_at: timestampNow(),
        })
        if (error) throw error
      })
      void nextSave.then(() => {
        if (revision.current === currentRevision) setSaveStatus('saved')
      }).catch(cause => {
        console.error('Could not save account data', cause)
        if (revision.current === currentRevision) {
          setSaveStatus('error')
          setSaveError(cause instanceof Error ? cause.message : 'Your changes could not be saved. Please retry.')
        }
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [data, enqueueSave, loading, migrationPending, userId, saveToken])

  const importLegacyData = () => {
    if (!legacyData.current) return
    const imported = normalizeData(legacyData.current, userName)
    if (userName) imported.profile.name = userName
    setData(imported)
    legacyData.current = null
    canSave.current = true
    setMigrationPending(false)
  }
  const discardLegacyData = () => {
    legacyData.current = null
    canSave.current = true
    setMigrationPending(false)
  }
  return {
    data, setData, loading, loadError, saveStatus, saveError, migrationPending,
    importLegacyData, discardLegacyData,
    reload: () => {
      setLoading(true)
      setLoadError('')
      setReloadToken(value => value + 1)
    },
    retrySave: () => setSaveToken(value => value + 1),
    enqueueSave,
  }
}
function ageParts(dob: string, now = new Date()) {
  const birth = new Date(`${dob}T00:00:00`)
  if (Number.isNaN(birth.getTime()) || birth > now) return null
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()
  if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
  if (months < 0) { years -= 1; months += 12 }
  return { years, months, days }
}
function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, eh * 60 + em - sh * 60 - sm)
}
function percent(value: number, goal: number) { return goal > 0 ? Math.min(100, Math.round(value / goal * 100)) : 0 }
function displayDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
function zonedDate(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day))
}
function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}
function uid() { return crypto.randomUUID() }
function timestampNow() { return new Date().toISOString() }
function getFoods(data: AppData, date: string): FoodItem[] {
  return data.foods[date] ?? [
    { id: 'oats', name: 'Oats', meal: 'Breakfast', quantity: 40, unit: 'g', calories: 156, protein: 6.8, carbs: 26.5, fat: 2.8, fibre: 4.2, state: 'Dry', consumed: false },
    { id: 'chia', name: 'Chia seeds', meal: 'Breakfast', quantity: 5, unit: 'g', calories: 24, protein: 0.8, carbs: 2.1, fat: 1.5, fibre: 1.7, state: 'Dry', consumed: false },
    { id: 'flax', name: 'Flax seeds', meal: 'Breakfast', quantity: 5, unit: 'g', calories: 27, protein: 0.9, carbs: 1.5, fat: 2.1, fibre: 1.4, state: 'Dry', consumed: false },
    { id: 'pumpkin', name: 'Pumpkin seeds', meal: 'Breakfast', quantity: 5, unit: 'g', calories: 28, protein: 1.5, carbs: 0.5, fat: 2.5, fibre: 0.3, state: 'Dry', consumed: false },
    { id: 'sunflower', name: 'Sunflower seeds', meal: 'Breakfast', quantity: 5, unit: 'g', calories: 29, protein: 1, carbs: 1, fat: 2.6, fibre: 0.4, state: 'Dry', consumed: false },
    { id: 'eggs', name: 'Whole eggs (3) + egg whites (3)', meal: 'Breakfast', quantity: 1, unit: 'serving', calories: 267, protein: 33, carbs: 2, fat: 14, fibre: 0, state: 'As served', consumed: false },
    { id: 'guava', name: 'Guava', meal: 'Breakfast', quantity: 150, unit: 'g', calories: 102, protein: 3.9, carbs: 21.5, fat: 1.5, fibre: 8.1, state: 'Raw', consumed: false },
    { id: 'rice-lunch', name: 'White rice', meal: 'Lunch', quantity: 250, unit: 'g', calories: 325, protein: 6.8, carbs: 70.5, fat: 0.7, fibre: 1, state: 'Cooked', consumed: false },
    { id: 'chicken-lunch', name: 'Skinless chicken breast', meal: 'Lunch', quantity: 200, unit: 'g', calories: 240, protein: 45, carbs: 0, fat: 5.2, fibre: 0, state: 'Raw weight', consumed: false },
    { id: 'chana', name: 'Brown chana', meal: 'Lunch', quantity: 40, unit: 'g', calories: 145, protein: 8, carbs: 24, fat: 2.4, fibre: 6.4, state: 'Dry', consumed: false },
    { id: 'salad', name: 'Carrot & cucumber', meal: 'Lunch', quantity: 150, unit: 'g', calories: 45, protein: 1.5, carbs: 10, fat: 0.3, fibre: 2.5, state: 'Raw estimate', consumed: false },
    { id: 'rice-dinner', name: 'White rice', meal: 'Dinner', quantity: 150, unit: 'g', calories: 195, protein: 4, carbs: 42.3, fat: 0.4, fibre: 0.6, state: 'Cooked', consumed: false },
    { id: 'chicken-dinner', name: 'Skinless chicken breast', meal: 'Dinner', quantity: 100, unit: 'g', calories: 120, protein: 22.5, carbs: 0, fat: 2.6, fibre: 0, state: 'Raw weight', consumed: false },
    { id: 'isabgol', name: 'Isabgol (optional)', meal: 'Dinner', quantity: 5, unit: 'g', calories: 10, protein: 0, carbs: 4, fat: 0, fibre: 4, state: 'Dry', consumed: false },
  ].map(item => ({ ...item, baseQuantity: item.quantity, baseCalories: item.calories, baseProtein: item.protein, baseCarbs: item.carbs, baseFat: item.fat, baseFibre: item.fibre }))
}

export default function App() {
  const client = supabase
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(() => !client)
  const [authError, setAuthError] = useState('')
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    if (!client) return
    let active = true
    void client.auth.getSession().then(({ data: result, error }) => {
      if (!active) return
      if (error) setAuthError(error.message)
      else setSession(result.session)
      setAuthReady(true)
    }).catch(cause => {
      console.error('Could not restore sign-in session', cause)
      if (active) {
        setAuthError(cause instanceof Error ? cause.message : 'Could not restore your sign-in session.')
        setAuthReady(true)
      }
    })
    const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setAuthError('')
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setAuthReady(true)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [client])

  if (!client) return <AuthScreen configured={false} />
  if (!authReady) return <div className="auth-loading" role="status">Restoring your secure session…</div>
  if (passwordRecovery && session) return <AuthScreen configured recovery onRecoveryComplete={() => setPasswordRecovery(false)} />
  if (!session) return <AuthScreen configured onAuthError={authError} />
  const user = session.user
  const userName = typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : ''
  return <LifeOS key={user.id} userId={user.id} userName={userName} onSignOut={async () => {
    const { error } = await client.auth.signOut()
    if (error) throw error
  }} />
}

function LifeOS({ userId, userName, onSignOut }: { userId: string; userName: string; onSignOut: () => Promise<void> }) {
  const { data, setData, loading, loadError, saveStatus, saveError, migrationPending, importLegacyData, discardLegacyData, reload, retrySave, enqueueSave } = useAppData(userId, userName)
  const [page, setPage] = useState<Page>('Overview')
  const [selectedDate, setSelectedDate] = useState(localDate(data.profile.timezone))
  const [clock, setClock] = useState(() => new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<'Python' | 'SQL'>('Python')
  const [calendarMonth, setCalendarMonth] = useState(new Date(`${selectedDate}T12:00:00`))
  const [activityFilter, setActivityFilter] = useState('All')
  const [toast, setToast] = useState('')
  const [signOutError, setSignOutError] = useState('')
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => { document.documentElement.dataset.theme = data.profile.theme }, [data.profile.theme])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (loading) return <div className="auth-loading" role="status">Loading your saved Life OS data…</div>
  if (loadError) return <main className="auth-loading"><div className="load-error-card" role="alert"><ShieldAlert size={22} /><h1>We couldn’t load your account data</h1><p>{loadError}</p><div><button className="button button-primary" onClick={reload}>Retry</button><button className="button button-muted" onClick={() => void onSignOut()}>Sign out</button></div></div></main>

  const today = localDate(data.profile.timezone)
  const activities = data.activities[selectedDate] ?? makeDay(data.templates)
  const putActivities = (items: ActivityItem[]) => setData(previous => ({ ...previous, activities: { ...previous.activities, [selectedDate]: items } }))
  const completeCount = activities.filter(item => item.status === 'Completed').length
  const dayProgress = activities.length ? Math.round(completeCount / activities.length * 100) : 0
  const foods = getFoods(data, selectedDate)
  const consumedFoods = foods.filter(item => item.consumed)
  const nutrition = consumedFoods.reduce((total, item) => ({ calories: total.calories + item.calories, protein: total.protein + item.protein, carbs: total.carbs + item.carbs, fat: total.fat + item.fat, fibre: total.fibre + item.fibre }), { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })
  const waterEntries = data.water[selectedDate] ?? []
  const waterTotal = waterEntries.reduce((sum, item) => sum + item.ml, 0)
  const latestWeight = [...data.weights].sort((a, b) => b.date.localeCompare(a.date))[0]
  const age = ageParts(data.profile.dob, zonedDate(clock, data.profile.timezone))
  const greeting = clock.getHours() < 12 ? 'Good morning' : clock.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const selectedDisplay = displayDate(selectedDate)
  const setProfile = (key: keyof AppData['profile'], value: string | number | 'dark' | 'light') => setData(previous => ({ ...previous, profile: { ...previous.profile, [key]: value } }))
  const signOutAndSave = async () => {
    if (migrationPending) { await onSignOut(); return }
    const serialized = JSON.stringify(data)
    const payload = JSON.parse(serialized) as Json
    const save = enqueueSave(async () => {
      if (!supabase) throw new Error('Cloud storage is not configured.')
      const { error } = await supabase.from('user_life_os_data').upsert({
        user_id: userId,
        data: payload,
        updated_at: timestampNow(),
      })
      if (error) throw error
    })
    await save
    await onSignOut()
  }
  const changeDate = (offset: number) => {
    const next = new Date(`${selectedDate}T12:00:00`)
    next.setDate(next.getDate() + offset)
    setSelectedDate(localDateForDate(next))
  }
  const goToday = () => setSelectedDate(today)
  const updateActivity = (id: string, changes: Partial<ActivityItem>) => {
    const item = activities.find(entry => entry.id === id)
    const status = changes.status
    const timestamp = timestampNow()
    putActivities(activities.map(entry => entry.id === id ? {
      ...entry, ...changes,
      startedAt: status === 'In Progress' && entry.status !== 'In Progress' ? timestamp : entry.startedAt,
      completedAt: status === 'Completed' ? timestamp : status ? undefined : entry.completedAt,
    } : entry))
    if (status === 'Completed' && item?.status !== 'Completed') setToast('Activity completed — saved for this date')
  }
  const saveFoods = (items: FoodItem[]) => setData(previous => ({ ...previous, foods: { ...previous.foods, [selectedDate]: items } }))
  const addWater = (ml: number) => {
    if (!Number.isFinite(ml) || ml <= 0 || ml > 5000) { setToast('Enter a water amount between 1 and 5,000 ml'); return }
    setData(previous => ({ ...previous, water: { ...previous.water, [selectedDate]: [...(previous.water[selectedDate] ?? []), { id: uid(), time: new Date().toISOString(), ml }] } }))
    setToast(`${ml} ml water logged`)
  }
  const addActivity = () => {
    const title = window.prompt('Activity name')
    if (!title?.trim()) return
    const start = window.prompt('Start time (24-hour HH:MM)', '09:00')
    if (start === null) return
    const end = window.prompt('End time (24-hour HH:MM)', '10:00')
    if (end === null) return
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || minutesBetween(start, end) === 0) { setToast('Use valid start and end times'); return }
    const id = uid()
    const item: ActivityItem = { id, title: title.trim(), category: 'Personal', start, end, status: 'Not Started', notes: '', reminder: false }
    putActivities([...activities, item])
    setData(previous => ({ ...previous, templates: [...previous.templates, { id, title: item.title, category: item.category, start, end }] }))
  }
  const addWeight = () => {
    const raw = window.prompt('Weight in kg', latestWeight?.weight.toString() ?? data.profile.startWeight.toString())
    if (raw === null) return
    const weight = Number(raw)
    if (!Number.isFinite(weight) || weight < 20 || weight > 400) { setToast('Enter a valid weight in kg'); return }
    const waistRaw = window.prompt('Waist in cm (optional)', '')
    setData(previous => ({ ...previous, weights: [...previous.weights, { id: uid(), date: selectedDate, weight, waist: waistRaw ? Number(waistRaw) : undefined, notes: '' }] }))
    setToast('Weigh-in saved')
  }
  const addFood = () => {
    const name = window.prompt('Food name')
    if (!name?.trim()) return
    const quantity = Number(window.prompt('Quantity (g or serving)', '100'))
    const caloriesRaw = window.prompt('Calories for this quantity', '0')
    if (caloriesRaw === null) return
    const proteinRaw = window.prompt('Protein in g', '0')
    if (proteinRaw === null) return
    const carbsRaw = window.prompt('Carbohydrates in g', '0')
    if (carbsRaw === null) return
    const fatRaw = window.prompt('Fat in g', '0')
    if (fatRaw === null) return
    const fibreRaw = window.prompt('Fibre in g', '0')
    if (fibreRaw === null) return
    const calories = Number(caloriesRaw), protein = Number(proteinRaw), carbs = Number(carbsRaw), fat = Number(fatRaw), fibre = Number(fibreRaw)
    if (![quantity, calories, protein, carbs, fat, fibre].every(Number.isFinite) || quantity <= 0 || [calories, protein, carbs, fat, fibre].some(value => value < 0)) { setToast('Please enter valid quantity and nutrition values'); return }
    const item: FoodItem = { id: uid(), name: name.trim(), meal: 'Snack', quantity, unit: 'g', calories, protein, carbs, fat, fibre, baseQuantity: quantity, baseCalories: calories, baseProtein: protein, baseCarbs: carbs, baseFat: fat, baseFibre: fibre, state: 'User entered', consumed: false }
    saveFoods([...foods, item])
  }
  const addStudyLog = (kind: 'tech' | 'exam') => {
    const label = window.prompt(kind === 'tech' ? 'Topic or session name' : 'Subject and topic')
    if (!label?.trim()) return
    const minutes = Number(window.prompt('Actual study minutes', '25'))
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) { setToast('Enter a valid study duration'); return }
    const log: Log = { id: uid(), date: selectedDate, label: label.trim(), minutes }
    setData(previous => ({ ...previous, [kind === 'tech' ? 'studyLogs' : 'examLogs']: [...(kind === 'tech' ? previous.studyLogs : previous.examLogs), log] }))
  }
  const pageTitle: Record<Page, string> = { Overview: 'Your day, in focus', Schedule: 'Daily schedule', Calendar: 'Your calendar', Training: 'Training log', Weight: 'Weight journey', Nutrition: 'Nutrition & hydration', Learning: 'Technical learning', 'SSC CGL': 'SSC CGL preparation', Reports: 'Reports & insights', Settings: 'Settings' }
  const categoryOptions = ['All', 'Fitness', 'Nutrition', 'Technical learning', 'Exam preparation', 'Personal']

  const dateControls = <div className="date-controls">
    <button className="icon-button" aria-label="Previous day" onClick={() => changeDate(-1)}><ArrowLeft size={16} /></button>
    <input aria-label="Select date" type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} />
    <button className="icon-button" aria-label="Next day" onClick={() => changeDate(1)}><ArrowRight size={16} /></button>
    <button className="button button-muted today-button" onClick={goToday}>Today</button>
  </div>

  const activityList = (compact = false) => {
    const visible = activities.filter(item => activityFilter === 'All' || item.category === activityFilter)
    const edit = (item: ActivityItem) => {
      const title = window.prompt('Activity name', item.title)
      if (!title?.trim()) return
      const category = window.prompt('Category', item.category)
      if (!category?.trim()) return
      const start = window.prompt('Start time (24-hour HH:MM)', item.start)
      const end = window.prompt('End time (24-hour HH:MM)', item.end)
      if (!start || !end || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || minutesBetween(start, end) === 0) { setToast('Use valid start and end times'); return }
      const changes = { title: title.trim(), category: category.trim(), start, end }
      putActivities(activities.map(entry => entry.id === item.id ? { ...entry, ...changes } : entry))
      setData(previous => ({ ...previous, templates: previous.templates.map(template => template.id === item.id ? { ...template, ...changes } : template) }))
    }
    const remove = (item: ActivityItem) => {
      if (!window.confirm(`Delete "${item.title}" from this date and future default schedules?`)) return
      putActivities(activities.filter(entry => entry.id !== item.id))
      setData(previous => ({ ...previous, templates: previous.templates.filter(template => template.id !== item.id) }))
    }
    return <div className={`activity-list ${compact ? 'compact' : ''}`}>
      {visible.map(item => <div className={`activity-row ${item.status === 'Completed' ? 'is-complete' : ''}`} key={item.id}>
        <button className={`check-control ${item.status === 'Completed' ? 'checked' : ''}`} aria-label={`Mark ${item.title} ${item.status === 'Completed' ? 'not completed' : 'completed'}`} onClick={() => updateActivity(item.id, { status: item.status === 'Completed' ? 'Not Started' : 'Completed' })}>{item.status === 'Completed' && <Check size={14} />}</button>
        <div className="activity-time">{item.start}<span>{item.end}</span></div>
        <div className="activity-main"><strong>{item.title}</strong><span>{item.category}{item.startedAt ? ` · Started ${new Date(item.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: data.profile.timezone })}` : ''}{item.completedAt ? ` · Done ${new Date(item.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: data.profile.timezone })}` : ''}</span>
          {!compact && <input className="notes-input" aria-label={`Notes for ${item.title}`} placeholder="Add a note…" value={item.notes} onChange={event => updateActivity(item.id, { notes: event.target.value })} />}
        </div>
        {!compact && <select aria-label={`Status for ${item.title}`} value={item.status} onChange={event => updateActivity(item.id, { status: event.target.value as Status })}>{['Not Started', 'In Progress', 'Completed', 'Skipped'].map(status => <option key={status}>{status}</option>)}</select>}
        {!compact && <div className="activity-actions"><button className={`icon-button reminder ${item.reminder ? 'active' : ''}`} title="Toggle in-app reminder" aria-label="Toggle reminder" onClick={() => updateActivity(item.id, { reminder: !item.reminder })}><Bell size={15} /></button><button className="icon-button" title="Edit activity" aria-label={`Edit ${item.title}`} onClick={() => edit(item)}><Settings size={14} /></button><button className="icon-button" title="Delete activity" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 size={14} /></button></div>}
      </div>)}
      {visible.length === 0 && <Empty text="No activities match this filter." />}
    </div>
  }

  const weightChart = () => {
    const entries = [...data.weights].sort((a, b) => a.date.localeCompare(b.date))
    if (entries.length === 0) return <Empty text="No weigh-ins yet. Add a measurement to start your trend." />
    const values = entries.map(item => item.weight)
    const min = Math.min(...values, data.profile.goalWeight) - 1
    const max = Math.max(...values, data.profile.startWeight) + 1
    const points = entries.map((item, index) => `${entries.length === 1 ? 50 : index / (entries.length - 1) * 100},${100 - (item.weight - min) / Math.max(1, max - min) * 84 - 8}`).join(' ')
    return <div className="chart-wrap"><svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Saved weight entries trend"><line x1="0" y1="92" x2="100" y2="92" className="chart-axis" /><polyline points={points} className="weight-line" />{entries.map((entry, index) => <circle key={entry.id} cx={entries.length === 1 ? 50 : index / (entries.length - 1) * 100} cy={100 - (entry.weight - min) / Math.max(1, max - min) * 84 - 8} r="1.5" className="chart-dot"><title>{entry.date}: {entry.weight} kg</title></circle>)}</svg><div className="chart-labels"><span>{entries[0].date}</span><span>{entries.at(-1)?.date}</span></div></div>
  }

  const foodRows = () => <div className="food-list">{foods.map(food => <div className={`food-row ${food.consumed ? 'eaten' : ''}`} key={food.id}>
    <button className={`check-control small-check ${food.consumed ? 'checked' : ''}`} aria-label={`Mark ${food.name} consumed`} onClick={() => saveFoods(foods.map(item => item.id === food.id ? { ...item, consumed: !item.consumed } : item))}>{food.consumed && <Check size={12} />}</button>
    <div className="food-name"><strong>{food.name}</strong><span>{food.meal} · {food.state}</span></div>
    <label className="quantity-edit"><input aria-label={`${food.name} quantity`} type="number" min="0" value={food.quantity} onChange={event => { const next = Number(event.target.value); if (Number.isFinite(next) && next >= 0) saveFoods(foods.map(item => item.id === food.id ? { ...item, quantity: next, calories: item.baseCalories * next / item.baseQuantity, protein: item.baseProtein * next / item.baseQuantity, carbs: item.baseCarbs * next / item.baseQuantity, fat: item.baseFat * next / item.baseQuantity, fibre: item.baseFibre * next / item.baseQuantity } : item)) }} /> {food.unit}</label>
    <span className="food-cal">{Math.round(food.calories)} kcal</span>
    <div className="food-actions"><button className="icon-button" aria-label={`Edit nutrition for ${food.name}`} onClick={() => {
      const values = [
        window.prompt('Calories for this quantity', food.calories.toFixed(1)),
        window.prompt('Protein in g', food.protein.toFixed(1)),
        window.prompt('Carbohydrates in g', food.carbs.toFixed(1)),
        window.prompt('Fat in g', food.fat.toFixed(1)),
        window.prompt('Fibre in g', food.fibre.toFixed(1)),
      ]
      if (values.some(value => value === null)) return
      const [calories, protein, carbs, fat, fibre] = values.map(Number)
      if ([calories, protein, carbs, fat, fibre].some(value => !Number.isFinite(value) || value < 0)) { setToast('Nutrition values must be valid non-negative numbers'); return }
      const scale = food.quantity / food.baseQuantity
      saveFoods(foods.map(item => item.id === food.id ? { ...item, calories, protein, carbs, fat, fibre, baseCalories: scale ? calories / scale : calories, baseProtein: scale ? protein / scale : protein, baseCarbs: scale ? carbs / scale : carbs, baseFat: scale ? fat / scale : fat, baseFibre: scale ? fibre / scale : fibre } : item))
    }}><Settings size={14} /></button><button className="icon-button" aria-label={`Remove ${food.name}`} onClick={() => saveFoods(foods.filter(item => item.id !== food.id))}><Trash2 size={14} /></button></div>
  </div>)}</div>

  const calendarContent = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const offset = (new Date(year, month, 1).getDay() + 6) % 7
    const count = new Date(year, month + 1, 0).getDate()
    const cells = Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1
      if (day < 1 || day > count) return <div className="calendar-cell muted-cell" key={`empty-${index}`} />
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayItems = data.activities[date] ?? (date === selectedDate ? activities : [])
      const done = dayItems.filter(item => item.status === 'Completed').length
      const progress = dayItems.length ? Math.round(done / dayItems.length * 100) : 0
      const active = date === selectedDate
      return <button key={date} className={`calendar-cell ${active ? 'selected' : ''} ${date === today ? 'today-cell' : ''}`} onClick={() => { setSelectedDate(date); setPage('Schedule') }}>
        <span className="calendar-day">{day}</span>{dayItems.length > 0 && <><span className="calendar-meter"><i style={{ width: `${progress}%` }} /></span><small>{done}/{dayItems.length}</small></>}
      </button>
    })
    return <><div className="calendar-head"><button className="icon-button" aria-label="Previous month" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}><ChevronLeft size={18} /></button><strong>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong><button className="icon-button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}><ChevronRight size={18} /></button></div><div className="calendar-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div className="weekday" key={day}>{day}</div>)}{cells}</div></>
  }

  const trainingPage = () => {
    const selectedDay = new Date(`${selectedDate}T12:00:00`).getDay()
    const selectedWorkout = workoutSplit.find(workout => workout.day === selectedDay) ?? workoutSplit[0]
    const weekStart = new Date(`${selectedDate}T12:00:00`)
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7)
    const weekDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + index)
      return localDateForDate(date)
    })
    const visibleExercises = selectedWorkout.exercises.filter(exercise => `${exercise.name} ${exercise.group} ${exercise.target}`.toLowerCase().includes(exerciseSearch.toLowerCase()))
    const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Legs', 'Glutes', 'Calves', 'Core']
    return <>
      <div className="page-toolbar"><div><p className="eyebrow">6-DAY PUSH / PULL / LEGS · ONE RECOVERY DAY</p><h2>Training log</h2></div><div className="toolbar-actions">{dateControls}<span className="safety-tag"><ShieldAlert size={15} /> Stop if you feel sharp pain</span></div></div>
      <Card className="weekly-plan-card">
        <div className="card-heading"><div><p className="eyebrow">WEEKLY ROTATION</p><h3>Every major muscle, twice per week</h3></div><span className="status-pill">Selected date: {selectedWorkout.title}</span></div>
        <div className="weekly-plan">{weekDates.map((date, index) => {
          const workout = workoutSplit.find(item => item.day === (index + 1) % 7) ?? workoutSplit[0]
          const isSelected = date === selectedDate
          const isToday = date === today
          return <button key={date} className={`weekly-day ${isSelected ? 'selected' : ''} ${workout.isRest ? 'recovery-day' : ''}`} aria-pressed={isSelected} onClick={() => setSelectedDate(date)}>
            <span className="weekly-day-name">{workout.label}</span><strong>{workout.title}</strong><small>{isToday ? 'Today · ' : ''}{workout.focus.split(' · ').slice(0, 2).join(' · ')}</small>
          </button>
        })}</div>
      </Card>
      <div className="training-layout">
        <Card>
          <div className="card-heading"><div><p className="eyebrow">{selectedDisplay.toUpperCase()} · {selectedWorkout.focus.toUpperCase()}</p><h3>{selectedWorkout.isRest ? 'Rest & recovery' : selectedWorkout.title}</h3></div><span className="status-pill">{data.finishedWorkouts.includes(selectedDate) ? 'Finished' : selectedWorkout.isRest ? 'Recovery day' : 'In progress'}</span></div>
          {selectedWorkout.isRest ? <div className="recovery-note"><h4>Let your body adapt</h4><p>Take a full rest day or choose easy walking and gentle mobility. Sleep, hydration and recovery are part of the plan—not missed workouts.</p></div> : <>
            <p className="subtle">Warm up before working sets. Use controlled form and finish most sets with about 1–3 good reps in reserve.</p>
            <div className="exercise-search"><Search size={16} /><input placeholder="Search today's exercises or muscles…" value={exerciseSearch} onChange={event => setExerciseSearch(event.target.value)} /></div>
            <div className="exercise-list">{visibleExercises.map(exercise => {
              const key = `${selectedDate}:${exercise.name}`
              const savedChecks = data.setLogs[key] ?? []
              const checks = Array.from({ length: exercise.sets }, (_, index) => savedChecks[index] ?? false)
              return <div className="exercise-card" key={exercise.name}>
                <div className="exercise-description"><strong>{exercise.name}</strong><span>{exercise.group} · {exercise.target}</span><small>{exercise.sets} sets × {exercise.reps} reps · Rest {exercise.rest}</small></div>
                <div className="set-checks">{checks.map((done, index) => <button key={index} className={`set-chip ${done ? 'set-done' : ''}`} aria-label={`${exercise.name} set ${index + 1}`} aria-pressed={done} onClick={() => setData(previous => {
                  const previousChecks = previous.setLogs[key] ?? []
                  const nextChecks = Array.from({ length: exercise.sets }, (_, setIndex) => setIndex === index ? !(previousChecks[setIndex] ?? false) : previousChecks[setIndex] ?? false)
                  return { ...previous, setLogs: { ...previous.setLogs, [key]: nextChecks } }
                })}>Set {index + 1}{done && <Check size={12} />}</button>)}</div>
              </div>
            })}</div>
            {visibleExercises.length === 0 && <div className="empty-state"><p>No exercises match that search in this session.</p></div>}
            <button className="button button-primary finish-workout" onClick={() => {
              if (data.finishedWorkouts.includes(selectedDate)) { setToast('Workout was already finished for this date'); return }
              setData(previous => ({ ...previous, finishedWorkouts: [...previous.finishedWorkouts, selectedDate] }))
              setToast('Workout finished and saved')
            }}><CheckCircle2 size={16} /> Finish workout</button>
          </>}
          <p className="fine-print">Set checks and workout completion save against this date and sync with your account. Scale or substitute movements to suit your equipment; stop if you feel pain.</p>
        </Card>
        <Card>
          <div className="card-heading"><div><p className="eyebrow">BALANCED COVERAGE</p><h3>Muscle regions</h3></div><Dumbbell className="muted-icon" size={20} /></div>
          {muscleGroups.map(group => <div className="muscle-row" key={group}><span>{group}</span><strong>{exercises.filter(exercise => exercise.group === group).length} movements</strong></div>)}
          <div className="inline-note compact-note"><CircleHelp size={15} /><span>The A/B variations distribute weekly volume across upper/lower chest, back and lats, all deltoid heads, arms, quads, hamstrings, glutes, calves and core.</span></div>
          <div className="recovery-note compact-recovery"><strong>Progress gradually</strong><p>When every set reaches the top of its rep range with good form, increase the load slightly. Take an extra rest day when recovery calls for it.</p></div>
        </Card>
      </div>
    </>
  }

  const pageContent = () => {
    if (page === 'Training') return trainingPage()
    if (page === 'Overview') return <>
      <section className="welcome-row"><div><p className="eyebrow">{greeting.toUpperCase()}</p><h2>{data.profile.name.split(' ')[1] ?? data.profile.name}<span className="accent">.</span></h2><p className="welcome-meta">{clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}<span className="meta-dot" />{clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: data.profile.timezone })} {data.profile.timezone.split('/').at(-1)?.replace('_', ' ')}</p></div><div className="age-card"><span>YOUR AGE</span><strong>{age ? `${age.years}y ${age.months}m ${age.days}d` : 'Add birth date'}</strong><small>Calculated from your date of birth</small></div></section>
      <section className="stat-grid">
        <Stat icon={CheckCircle2} label="Today's completion" value={`${dayProgress}%`} detail={`${completeCount} of ${activities.length} activities`} accent="blue" />
        <Stat icon={Weight} label="Latest weigh-in" value={latestWeight ? `${latestWeight.weight} kg` : `${data.profile.startWeight} kg`} detail={latestWeight ? `Recorded ${latestWeight.date}` : 'Starting reference · no new weigh-in'} accent="violet" />
        <Stat icon={Flame} label="Nutrition today" value={`${Math.round(nutrition.calories)} kcal`} detail={`${Math.round(nutrition.protein)} g protein · consumed items`} accent="orange" />
        <Stat icon={Droplets} label="Water today" value={`${(waterTotal / 1000).toFixed(1)} L`} detail={`${percent(waterTotal, data.profile.waterGoal)}% of ${(data.profile.waterGoal / 1000).toFixed(1)} L goal`} accent="cyan" />
      </section>
      <section className="dashboard-grid">
        <Card className="schedule-card"><div className="card-heading"><div><p className="eyebrow">DAILY PLAN</p><h3>{selectedDate === today ? 'Today’s schedule' : selectedDisplay}</h3></div><button className="text-button" onClick={() => setPage('Schedule')}>Full schedule <ArrowRight size={14} /></button></div><Progress value={dayProgress} label={`${completeCount} / ${activities.length} complete`} /><div className="mini-schedule">{activityList(true)}</div></Card>
        <div className="right-stack"><Card><div className="card-heading"><div><p className="eyebrow">YOUR TARGET</p><h3>Weight goal</h3></div><TrendingDown className="muted-icon" size={19} /></div><div className="weight-summary"><div><strong>{latestWeight ? latestWeight.weight : data.profile.startWeight}<small> kg</small></strong><span>{latestWeight ? 'Most recent measurement' : 'Starting reference'}</span></div><div className="goal-pill"><Target size={14} />{data.profile.goalWeight} kg goal</div></div><Progress value={percent(Math.max(0, data.profile.startWeight - (latestWeight?.weight ?? data.profile.startWeight)), data.profile.startWeight - data.profile.goalWeight)} label={`${Math.max(0, data.profile.startWeight - (latestWeight?.weight ?? data.profile.startWeight)).toFixed(1)} kg recorded toward goal`} /></Card>
        <Card><div className="card-heading"><div><p className="eyebrow">FOCUS AREAS</p><h3>Learning progress</h3></div><GraduationCap className="muted-icon" size={19} /></div><div className="learning-summary"><div><span>Python</span><Progress value={percent(data.completedTopics.filter(topic => topic.startsWith('Python:')).length, pythonTopics.length)} label={`${data.completedTopics.filter(topic => topic.startsWith('Python:')).length} / ${pythonTopics.length} topics`} /></div><div><span>SQL</span><Progress value={percent(data.completedTopics.filter(topic => topic.startsWith('SQL:')).length, sqlTopics.length)} label={`${data.completedTopics.filter(topic => topic.startsWith('SQL:')).length} / ${sqlTopics.length} topics`} /></div></div></Card></div>
      </section>
      <section className="bottom-grid"><Card><div className="card-heading"><div><p className="eyebrow">HYDRATION</p><h3>Water tracker</h3></div><button className="icon-button" aria-label="Open nutrition" onClick={() => setPage('Nutrition')}><ArrowRight size={16} /></button></div><div className="water-display"><div className="water-ring" style={{ '--progress': `${percent(waterTotal, data.profile.waterGoal)}%` } as React.CSSProperties}><Droplets size={21} /><strong>{percent(waterTotal, data.profile.waterGoal)}%</strong></div><div><strong>{(waterTotal / 1000).toFixed(2)} <small>/ {(data.profile.waterGoal / 1000).toFixed(1)} L</small></strong><span>Only explicitly logged water is counted.</span></div></div><div className="quick-add">{[150, 250, 500].map(amount => <button className="button button-muted" key={amount} onClick={() => addWater(amount)}>+ {amount} ml</button>)}</div></Card><Card><div className="card-heading"><div><p className="eyebrow">ON YOUR PLAN</p><h3>Upcoming activities</h3></div><button className="text-button" onClick={() => setPage('Schedule')}>See all <ArrowRight size={14} /></button></div>{activities.filter(item => item.status === 'Not Started' && item.start >= clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })).slice(0, 3).map(item => <div className="upcoming-row" key={item.id}><span className="upcoming-time">{item.start}</span><span>{item.title}</span></div>)}{activities.every(item => item.status !== 'Not Started') && <Empty text="No upcoming activities on this date." />}</Card></section>
    </>
    if (page === 'Schedule') return <><div className="page-toolbar"><div><p className="eyebrow">DATE-SPECIFIC ACTIVITY RECORDS</p><h2>{selectedDisplay}</h2></div><div className="toolbar-actions">{dateControls}<button className="button button-primary" onClick={addActivity}><Plus size={16} /> Add activity</button></div></div><Card><div className="card-heading"><div><h3>Daily timetable</h3><p className="subtle">Completion is never inferred from the time. Only your explicit updates count.</p></div><div className="filter-select"><span>Filter</span><select aria-label="Filter activities" value={activityFilter} onChange={event => setActivityFilter(event.target.value)}>{categoryOptions.map(item => <option key={item}>{item}</option>)}</select></div></div><Progress value={dayProgress} label={`${completeCount} completed · ${activities.filter(item => item.status === 'Skipped').length} skipped · ${activities.length} planned`} />{activityList()}</Card><div className="inline-note"><CircleHelp size={16} /><span>Every date has an independent schedule. Your activity status, notes, and completion time are saved locally on this device.</span></div></>
    if (page === 'Calendar') return <><div className="page-toolbar"><div><p className="eyebrow">MONTHLY ACTIVITY VIEW</p><h2>Calendar</h2></div><button className="button button-muted" onClick={goToday}>Go to today</button></div><Card className="calendar-card">{calendarContent()}<div className="calendar-legend"><span><i className="legend-dot complete-dot" /> Completed</span><span><i className="legend-dot pending-dot" /> Planned</span><span>Click a day to open its timetable</span></div></Card></>
    if (page === 'Weight') {
      const lost = latestWeight ? data.profile.startWeight - latestWeight.weight : 0
      return <><div className="page-toolbar"><div><p className="eyebrow">MEASUREMENTS, NOT GUESSES</p><h2>Weight journey</h2></div><button className="button button-primary" onClick={addWeight}><Plus size={16} /> Add weigh-in</button></div><section className="stat-grid"><Stat icon={Weight} label="Latest measurement" value={latestWeight ? `${latestWeight.weight} kg` : 'No weigh-in'} detail={latestWeight ? `Recorded ${latestWeight.date}` : `Starting reference: ${data.profile.startWeight} kg`} accent="blue" /><Stat icon={TrendingDown} label="Change from start" value={latestWeight ? `${lost > 0 ? '−' : '+'}${Math.abs(lost).toFixed(1)} kg` : 'Not measured'} detail="Based on latest saved entry" accent="violet" /><Stat icon={Target} label="Remaining to goal" value={`${Math.max(0, (latestWeight?.weight ?? data.profile.startWeight) - data.profile.goalWeight).toFixed(1)} kg`} detail={`Goal: ${data.profile.goalWeight} kg`} accent="orange" /></section><Card><div className="card-heading"><div><p className="eyebrow">RECORDED ENTRIES</p><h3>Weight trend</h3></div><span className="subtle">No sample measurements</span></div>{weightChart()}</Card><Card className="history-card"><h3>Measurement history</h3>{data.weights.length ? [...data.weights].sort((a, b) => b.date.localeCompare(a.date)).map(item => <div className="history-row" key={item.id}><span>{item.date}</span><strong>{item.weight} kg</strong><span>{item.waist ? `Waist ${item.waist} cm` : item.notes || '—'}</span></div>) : <Empty text="Your first saved weigh-in will appear here." />}</Card></>
    }
    if (page === 'Nutrition') return <><div className="page-toolbar"><div><p className="eyebrow">ESTIMATES · EDITABLE FOOD VALUES</p><h2>Nutrition & hydration</h2></div>{dateControls}</div><section className="nutrition-top"><Card><div className="card-heading"><div><p className="eyebrow">CONSUMED ITEMS ONLY</p><h3>Daily nutrition</h3></div><Apple className="muted-icon" size={19} /></div><div className="macro-total"><strong>{Math.round(nutrition.calories)}<small> kcal</small></strong><span>of {data.profile.calorieGoal.toLocaleString()} kcal goal · planned food is not counted</span></div><Progress value={percent(nutrition.calories, data.profile.calorieGoal)} label={`${Math.round(nutrition.protein)} g protein · ${data.profile.proteinGoal} g goal`} /><div className="macro-grid"><div><span>Carbs</span><strong>{Math.round(nutrition.carbs)} g</strong></div><div><span>Fat</span><strong>{Math.round(nutrition.fat)} g</strong></div><div><span>Fibre</span><strong>{Math.round(nutrition.fibre)} g</strong></div></div><p className="fine-print">Starting food estimates are approximate local values, not medical advice. Edit quantities and verify values with your preferred source.</p></Card><Card><div className="card-heading"><div><p className="eyebrow">EXPLICIT ENTRIES</p><h3>Water intake</h3></div><Droplets className="muted-icon" size={19} /></div><div className="water-display"><div className="water-ring" style={{ '--progress': `${percent(waterTotal, data.profile.waterGoal)}%` } as React.CSSProperties}><Droplets size={20} /><strong>{percent(waterTotal, data.profile.waterGoal)}%</strong></div><div><strong>{(waterTotal / 1000).toFixed(2)} <small>/ {(data.profile.waterGoal / 1000).toFixed(1)} L</small></strong><span>{waterEntries.length} logged entries</span></div></div><div className="quick-add">{[150, 250, 500].map(amount => <button className="button button-muted" key={amount} onClick={() => addWater(amount)}>+{amount} ml</button>)}<button className="button button-muted" onClick={() => addWater(Number(window.prompt('Water in ml', '300')))}>Custom</button></div>{waterEntries.slice(-4).reverse().map(item => <div className="history-row water-history" key={item.id}><span>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><strong>{item.ml} ml</strong></div>)}</Card></section><Card className="foods-card"><div className="card-heading"><div><p className="eyebrow">EDITABLE STARTER TEMPLATE</p><h3>Food diary</h3><p className="subtle">Check a food only after eating it. Raw, dry, and cooked quantities are distinguished.</p></div><button className="button button-muted" onClick={addFood}><Plus size={15} /> Add food</button></div>{foodRows()}</Card></>
    if (page === 'Learning') return <><div className="page-toolbar"><div><p className="eyebrow">PYTHON + SQL ROADMAP</p><h2>Technical learning</h2></div><button className="button button-primary" onClick={() => addStudyLog('tech')}><Plus size={16} /> Log study session</button></div><section className="stat-grid"><Stat icon={Clock3} label="Study time today" value={`${Math.round(data.studyLogs.filter(log => log.date === selectedDate).reduce((sum, log) => sum + log.minutes, 0))} min`} detail="From saved study sessions" accent="blue" /><Stat icon={CheckCircle2} label="Topics complete" value={`${data.completedTopics.length}`} detail="Only manually completed topics" accent="violet" /></section><Card><div className="topic-toolbar"><div className="segmented"><button className={topicFilter === 'Python' ? 'active' : ''} onClick={() => setTopicFilter('Python')}>Python</button><button className={topicFilter === 'SQL' ? 'active' : ''} onClick={() => setTopicFilter('SQL')}>SQL</button></div><Progress value={percent(data.completedTopics.filter(topic => topic.startsWith(`${topicFilter}:`)).length, topicFilter === 'Python' ? pythonTopics.length : sqlTopics.length)} label={`${data.completedTopics.filter(topic => topic.startsWith(`${topicFilter}:`)).length} / ${topicFilter === 'Python' ? pythonTopics.length : sqlTopics.length} completed`} /></div><div className="topic-list">{(topicFilter === 'Python' ? pythonTopics : sqlTopics).map(topic => { const key = `${topicFilter}:${topic}`; const done = data.completedTopics.includes(key); return <label className={`topic-row ${done ? 'topic-done' : ''}`} key={key}><input type="checkbox" checked={done} onChange={() => setData(previous => ({ ...previous, completedTopics: done ? previous.completedTopics.filter(item => item !== key) : [...previous.completedTopics, key] }))} /><span>{topic}</span>{done && <span className="topic-status">Completed</span>}</label>})}</div><div className="inline-note"><CircleHelp size={15} /><span>Timers ending do not complete topics automatically. Use the checkbox only after you finish the topic.</span></div></Card><Card><div className="card-heading"><div><p className="eyebrow">ACTUAL TIME LOGS</p><h3>Study history</h3></div></div>{data.studyLogs.length ? [...data.studyLogs].sort((a, b) => b.date.localeCompare(a.date)).map(log => <div className="history-row" key={log.id}><span>{log.date}</span><strong>{log.label}</strong><span>{log.minutes} min</span></div>) : <Empty text="No technical study sessions logged yet." />}</Card></>
    if (page === 'SSC CGL') return <><div className="page-toolbar"><div><p className="eyebrow">FOUR SUBJECT AREAS · RECORDED PERFORMANCE</p><h2>SSC CGL preparation</h2></div><div className="toolbar-actions"><button className="button button-muted" onClick={() => addStudyLog('exam')}><Plus size={15} /> Log study</button><button className="button button-primary" onClick={() => { const score = Number(window.prompt('Correct answers', '0')); const total = Number(window.prompt('Total questions', '0')); if (Number.isInteger(score) && Number.isInteger(total) && total > 0 && score >= 0 && score <= total) setData(previous => ({ ...previous, mocks: [...previous.mocks, { id: uid(), date: selectedDate, score, total }] })); else setToast('Enter valid correct and total question counts') }}><Plus size={15} /> Record mock test</button></div></div><div className="subject-grid">{subjects.map((subject, index) => <Card key={subject}><div className="subject-card-top"><span className={`subject-number color-${index}`}>0{index + 1}</span><span className="status-pill">Ready to log</span></div><h3>{subject}</h3><p className="subtle">Track your actual sessions and practice counts.</p><button className="text-button" onClick={() => addStudyLog('exam')}>Log a study session <ArrowRight size={14} /></button></Card>)}</div><Card><div className="card-heading"><div><p className="eyebrow">SAVED MOCK TESTS</p><h3>Score history</h3></div><span className="subtle">No exam results are fabricated</span></div>{data.mocks.length ? [...data.mocks].sort((a, b) => b.date.localeCompare(a.date)).map(mock => <div className="history-row" key={mock.id}><span>{mock.date}</span><strong>{mock.score} / {mock.total}</strong><span>{percent(mock.score, mock.total)}% accuracy</span></div>) : <Empty text="Record a mock test to build a score history." />}</Card><Card><h3>Study sessions</h3>{data.examLogs.length ? [...data.examLogs].sort((a, b) => b.date.localeCompare(a.date)).map(log => <div className="history-row" key={log.id}><span>{log.date}</span><strong>{log.label}</strong><span>{log.minutes} min</span></div>) : <Empty text="No SSC CGL study sessions logged yet." />}</Card></>
    if (page === 'Reports') {
      const totalLogs = [...data.studyLogs, ...data.examLogs]
      const totalMinutes = totalLogs.reduce((sum, log) => sum + log.minutes, 0)
      return <><div className="page-toolbar"><div><p className="eyebrow">CALCULATED FROM YOUR SAVED RECORDS</p><h2>Reports & insights</h2></div><button className="button button-primary" onClick={() => downloadCsv('dileep-life-os-activities.csv', [['date', 'activity', 'category', 'status', 'start', 'end', 'notes'], ...Object.entries(data.activities).flatMap(([date, items]) => items.map(item => [date, item.title, item.category, item.status, item.start, item.end, item.notes]))])}><Download size={16} /> Export activities</button></div><section className="stat-grid"><Stat icon={Activity} label="Activities recorded" value={Object.values(data.activities).flat().length.toString()} detail="Across saved dates" accent="blue" /><Stat icon={Dumbbell} label="Workouts finished" value={data.finishedWorkouts.length.toString()} detail="Explicitly marked complete" accent="violet" /><Stat icon={Clock3} label="Study time logged" value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} detail="Technical and SSC CGL sessions" accent="orange" /><Stat icon={Trophy} label="Topics completed" value={data.completedTopics.length.toString()} detail="Python and SQL topics" accent="cyan" /></section><div className="reports-grid"><Card><h3>Activity records</h3>{Object.keys(data.activities).length ? Object.entries(data.activities).sort(([a], [b]) => b.localeCompare(a)).slice(0, 10).map(([date, items]) => { const done = items.filter(item => item.status === 'Completed').length; return <div className="history-row" key={date}><span>{date}</span><strong>{done}/{items.length} completed</strong><span>{items.length ? percent(done, items.length) : 0}%</span></div> }) : <Empty text="Activity reports appear as you save daily records." />}</Card><Card><h3>Study by category</h3><div className="report-metric"><span>Python & SQL</span><strong>{data.studyLogs.reduce((sum, log) => sum + log.minutes, 0)} min</strong></div><div className="report-metric"><span>SSC CGL</span><strong>{data.examLogs.reduce((sum, log) => sum + log.minutes, 0)} min</strong></div><div className="report-metric"><span>Recorded weigh-ins</span><strong>{data.weights.length}</strong></div><div className="report-metric"><span>Water entries</span><strong>{Object.values(data.water).flat().length}</strong></div></Card></div><div className="inline-note"><ShieldAlert size={15} /><span>Export only contains records saved in this browser. Planned duration is not presented as actual time spent.</span></div></>
    }
    return <><div className="page-toolbar"><div><p className="eyebrow">PERSONALIZE YOUR SPACE</p><h2>Settings</h2></div></div><div className="settings-layout"><Card><div className="card-heading"><div><p className="eyebrow">PROFILE</p><h3>Personal details</h3></div></div><Setting label="Full name"><input value={data.profile.name} onChange={event => setProfile('name', event.target.value)} /></Setting><Setting label="Date of birth"><input type="date" value={data.profile.dob} onChange={event => setProfile('dob', event.target.value)} /></Setting><Setting label="Timezone"><select value={data.profile.timezone} onChange={event => setProfile('timezone', event.target.value)}><option>Asia/Kolkata</option><option>Asia/Dubai</option><option>Europe/London</option><option>America/New_York</option><option>UTC</option></select></Setting></Card><Card><div className="card-heading"><div><p className="eyebrow">GOALS & PREFERENCES</p><h3>Daily targets</h3></div></div><Setting label="Starting weight (kg)"><input type="number" value={data.profile.startWeight} onChange={event => setProfile('startWeight', Number(event.target.value))} /></Setting><Setting label="Goal weight (kg)"><input type="number" value={data.profile.goalWeight} onChange={event => setProfile('goalWeight', Number(event.target.value))} /></Setting><Setting label="Calorie target (estimate)"><input type="number" value={data.profile.calorieGoal} onChange={event => setProfile('calorieGoal', Number(event.target.value))} /></Setting><Setting label="Protein target (g)"><input type="number" value={data.profile.proteinGoal} onChange={event => setProfile('proteinGoal', Number(event.target.value))} /></Setting><Setting label="Water goal (ml)"><input type="number" value={data.profile.waterGoal} onChange={event => setProfile('waterGoal', Number(event.target.value))} /></Setting><Setting label="Appearance"><select value={data.profile.theme} onChange={event => setProfile('theme', event.target.value as 'dark' | 'light')}><option value="dark">Dark</option><option value="light">Light</option></select></Setting></Card><Card><div className="card-heading"><div><p className="eyebrow">DATA & PRIVACY</p><h3>Account data</h3></div><ShieldAlert className="muted-icon" size={18} /></div><p className="subtle">Your data is stored in your signed-in account and protected by row-level database policies. Export a copy regularly; access requires your account and configured Supabase project.</p><button className="button button-muted export-settings" onClick={() => downloadCsv('dileep-life-os-weights.csv', [['date', 'weight_kg', 'waist_cm', 'notes'], ...data.weights.map(item => [item.date, item.weight, item.waist ?? '', item.notes])])}><Download size={15} /> Export weigh-ins</button><button className="button button-muted export-settings" onClick={() => downloadCsv('dileep-life-os-study.csv', [['date', 'type', 'topic', 'minutes'], ...data.studyLogs.map(log => [log.date, 'Technical', log.label, log.minutes]), ...data.examLogs.map(log => [log.date, 'SSC CGL', log.label, log.minutes])])}><Download size={15} /> Export study sessions</button><button className="button button-danger export-settings" onClick={() => { if (window.confirm('Reset all Life OS data in this account to defaults? This cannot be undone.')) { setData({ ...defaults(), profile: { ...defaults().profile, name: userName || 'Demo User' } }); setToast('Account data reset and queued for cloud save') } }}><Trash2 size={15} /> Reset account data</button></Card></div><div className="inline-note"><Bell size={15} /><span>Activity reminders are in-app indicators only. Browser notifications and background push reminders are not enabled.</span></div></>
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'mobile-open' : ''}`}><div className="brand"><div className="brand-mark"><Activity size={20} /></div><div><strong>DILEEP<span> LIFE OS</span></strong><small>PERSONAL COMMAND CENTER</small></div><button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={18} /></button></div><div className="workspace-label">WORKSPACE</div><nav aria-label="Main navigation">{NAV.map(item => { const Icon = item.icon; return <button key={item.name} className={`nav-item ${page === item.name ? 'nav-active' : ''}`} onClick={() => { setPage(item.name); setMenuOpen(false) }}><Icon size={17} strokeWidth={1.8} /><span>{item.name}</span>{page === item.name && <i />}</button> })}</nav><div className="sidebar-bottom"><div className="sidebar-profile"><div className="avatar">D</div><div><strong>{data.profile.name.split(' ')[1] ?? 'Dileep'}</strong><span>Personal workspace</span></div><ChevronDown size={14} /></div><div className="local-tag"><span />LOCAL DEMO · DEVICE ONLY</div></div></aside>
    {menuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={19} /></button><span className="breadcrumb">Life OS</span><ChevronRight size={14} /><strong>{page}</strong></div><div className="topbar-right"><span className={`cloud-save-status ${saveStatus}`} role="status">{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed' : 'Cloud saved'}</span><span className="topbar-date">{clock.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span><button className="icon-button theme-toggle" aria-label="Toggle theme" onClick={() => setProfile('theme', data.profile.theme === 'dark' ? 'light' : 'dark')}>{data.profile.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><div className="top-avatar" title={userName || 'Account'}>{(data.profile.name.trim()[0] || 'U').toUpperCase()}</div><button className="icon-button signout-button" aria-label="Sign out" title="Sign out" onClick={() => void signOutAndSave().catch(error => { console.error('Sign out failed', error); setSignOutError(error instanceof Error ? error.message : 'Could not sign out') })}><LogOut size={16} /></button></div></header><div className="page-content"><div className="content-title"><div><p className="eyebrow">DILEEP LIFE OS <span className="meta-dot" /> {data.profile.timezone}</p><h1>{pageTitle[page]}</h1></div>{page !== 'Overview' && page !== 'Settings' && page !== 'Calendar' && page !== 'Training' && page !== 'Learning' && page !== 'SSC CGL' && page !== 'Reports' && page !== 'Weight' && page !== 'Nutrition' && <span className="subtle">{selectedDisplay}</span>}</div>{saveError && <div className="storage-error" role="alert"><ShieldAlert size={16} /><span>Cloud save failed: {saveError}</span><button className="button button-muted" onClick={retrySave}>Retry save</button></div>}{signOutError && <div className="storage-error" role="alert"><ShieldAlert size={16} />{signOutError}</div>}{migrationPending && <div className="migration-banner"><div><strong>Existing data found on this browser</strong><span>Import it into this signed-in account? It will be copied to your private cloud record.</span></div><button className="button button-primary" onClick={importLegacyData}>Import this browser’s data</button><button className="button button-muted" onClick={discardLegacyData}>Start fresh</button></div>}{pageContent()}<footer className="footer-note"><span>Made for steady progress, not perfect days.</span><span>PRIVATE ACCOUNT · CLOUD SYNC</span></footer></div></main>
    {toast && <div role="status" className="toast"><CheckCircle2 size={16} />{toast}</div>}
  </div>
}

function localDateForDate(date: Date) {
  const y = date.getFullYear()
  return `${y}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section> }
function Empty({ text }: { text: string }) { return <div className="empty-state"><span className="empty-mark"><CircleHelp size={18} /></span><p>{text}</p></div> }
function Progress({ value, label }: { value: number; label: string }) { return <div className="progress-block"><div className="progress-track"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div><div className="progress-label"><strong>{label}</strong><span>{Math.round(value)}%</span></div></div> }
function Stat({ icon: Icon, label, value, detail, accent }: { icon: typeof Activity; label: string; value: string; detail: string; accent: string }) { return <Card className="stat-card"><div className={`stat-icon ${accent}`}><Icon size={18} /></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></Card> }
function Setting({ label, children }: { label: string; children: React.ReactNode }) { return <label className="setting-row"><span>{label}</span>{children}</label> }

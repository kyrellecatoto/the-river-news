'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '../../../lib/supabase/auth'

const DIVISIONS = ['elementary', 'secondary']
const GROUPS = ['regular', 'demo', 'para']

function keyOf(region_code, division, event_group) {
  return `${region_code}__${division}__${event_group}`
}

function TallyCell({ cellData, isSaving, onUpdate, onSave }) {
  const [localData, setLocalData] = useState({
    gold: cellData.gold,
    silver: cellData.silver,
    bronze: cellData.bronze,
  })

  useEffect(() => {
    setLocalData({
      gold: cellData.gold,
      silver: cellData.silver,
      bronze: cellData.bronze,
    })
  }, [cellData.gold, cellData.silver, cellData.bronze])

  const handleChange = (medalType, value) => {
    // 1. Strip out any non-numeric characters (prevents letters/symbols)
    const numericValue = value.replace(/[^0-9]/g, '')
    
    // 2. Update local state so typing is instant
    setLocalData((prev) => ({ ...prev, [medalType]: numericValue }))

    // 3. Update parent state
    const parsed = parseInt(numericValue, 10)
    onUpdate({ [medalType]: isNaN(parsed) ? 0 : parsed })
  }

  const handleFocus = (e) => e.target.select()

  return (
    // Increased minimum widths so the inputs have plenty of space
    <td className="p-3 md:p-4 align-top min-w-[260px] md:min-w-[300px]">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text" // Changed to text to permanently kill the spinner
          inputMode="numeric" // Forces mobile number pad
          pattern="[0-9]*"
          value={localData.gold}
          onChange={(e) => handleChange('gold', e.target.value)}
          onFocus={handleFocus}
          // Increased padding (py-2.5) and text size (text-lg md:text-xl)
          className="w-full px-2 py-2.5 text-center rounded bg-gray-950 border border-gray-800 text-white text-lg md:text-xl font-bold focus:outline-none focus:border-yellow-400 focus:bg-gray-800 transition-colors"
          title="Gold"
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localData.silver}
          onChange={(e) => handleChange('silver', e.target.value)}
          onFocus={handleFocus}
          className="w-full px-2 py-2.5 text-center rounded bg-gray-950 border border-gray-800 text-white text-lg md:text-xl font-bold focus:outline-none focus:border-gray-300 focus:bg-gray-800 transition-colors"
          title="Silver"
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localData.bronze}
          onChange={(e) => handleChange('bronze', e.target.value)}
          onFocus={handleFocus}
          className="w-full px-2 py-2.5 text-center rounded bg-gray-950 border border-gray-800 text-white text-lg md:text-xl font-bold focus:outline-none focus:border-orange-400 focus:bg-gray-800 transition-colors"
          title="Bronze"
        />
      </div>

      <button
        onClick={onSave}
        disabled={isSaving}
        className="mt-3 w-full px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-[11px] md:text-xs font-bold transition-all uppercase tracking-wider"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </td>
  )
}

export default function AdminPalaroTallyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [regions, setRegions] = useState([])
  const [tallyMap, setTallyMap] = useState({})
  const [savingKey, setSavingKey] = useState(null)

  useEffect(() => {
    checkAuthAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkAuthAndLoad() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
      await loadAll()
    } catch (e) {
      console.error(e)
      router.push('/admin/login')
    }
  }

  async function loadAll() {
    try {
      setLoading(true)
      const supabase = createClient()

      const [{ data: rData, error: rErr }, { data: tData, error: tErr }] = await Promise.all([
        supabase.from('palaro_regions').select('*').order('sort_order', { ascending: true }),
        supabase.from('palaro_medal_tally').select('*'),
      ])

      if (rErr) throw rErr
      if (tErr) throw tErr

      setRegions(rData || [])

      const map = {}
      ;(tData || []).forEach((row) => {
        map[keyOf(row.region_code, row.division, row.event_group)] = {
          gold: row.gold ?? 0,
          silver: row.silver ?? 0,
          bronze: row.bronze ?? 0,
        }
      })
      setTallyMap(map)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load medal tally')
    } finally {
      setLoading(false)
    }
  }

  function getCell(region_code, division, event_group) {
    return tallyMap[keyOf(region_code, division, event_group)] || { gold: 0, silver: 0, bronze: 0 }
  }

  function setCell(region_code, division, event_group, patch) {
    const k = keyOf(region_code, division, event_group)
    setTallyMap((prev) => ({
      ...prev,
      [k]: { ...(prev[k] || { gold: 0, silver: 0, bronze: 0 }), ...patch },
    }))
  }

  async function saveCell(region_code, division, event_group) {
    const k = keyOf(region_code, division, event_group)
    const row = tallyMap[k] || { gold: 0, silver: 0, bronze: 0 }

    try {
      setSavingKey(k)
      const supabase = createClient()
      
      const { error } = await supabase.from('palaro_medal_tally').upsert(
        [
          {
            region_code,
            division,
            event_group,
            gold: row.gold,
            silver: row.silver,
            bronze: row.bronze,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'region_code,division,event_group' }
      )

      if (error) throw error
      toast.success('Saved successfully')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save')
    } finally {
      setSavingKey(null)
    }
  }

  const columns = useMemo(() => {
    const cols = []
    for (const division of DIVISIONS) {
      for (const group of GROUPS) {
        cols.push({ division, group, label: `${division} • ${group}` })
      }
    }
    return cols
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[100vw] overflow-hidden">
      <Toaster position="top-right" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Palarong Pambansa 2026 — Tally</h1>
          <p className="text-gray-400 text-xs md:text-sm mt-1">
            Edit medal counts. Ranking updates automatically on save.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors shrink-0"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto relative pb-2">
          <table className="min-w-max w-full">
            <thead className="bg-gray-950">
              <tr className="text-left text-xs text-gray-300 border-b border-gray-800">
                <th className="p-3 md:p-4 sticky left-0 z-20 bg-gray-950 border-r border-gray-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)]">
                  Region
                </th>
                {columns.map((c) => (
                  <th key={c.label} className="p-3 md:p-4">
                    <div className="font-bold capitalize text-gray-200">{c.label}</div>
                    <div className="text-[10px] md:text-xs text-gray-500 mt-2 flex justify-between px-2">
                      <span className="text-yellow-500">Gold</span>
                      <span className="text-gray-400">Silver</span>
                      <span className="text-orange-500">Bronze</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {regions.map((r) => (
                <tr key={r.code} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="p-3 md:p-4 sticky left-0 z-10 bg-gray-900 border-r border-gray-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)]">
                    <div className="text-white font-semibold whitespace-nowrap">{r.name}</div>
                    <div className="text-[10px] md:text-[11px] text-gray-500 mt-0.5">{r.code}</div>
                  </td>

                  {columns.map((c) => {
                    const cell = getCell(r.code, c.division, c.group)
                    const k = keyOf(r.code, c.division, c.group)
                    const isSaving = savingKey === k

                    return (
                      <TallyCell
                        key={k}
                        cellData={cell}
                        isSaving={isSaving}
                        onUpdate={(patch) => setCell(r.code, c.division, c.group, patch)}
                        onSave={() => saveCell(r.code, c.division, c.group)}
                      />
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 text-xs text-gray-400 bg-gray-950">
          Ranking is computed from totals: <span className="text-white font-semibold">Gold</span> →{' '}
          <span className="text-gray-300 font-semibold">Silver</span> →{' '}
          <span className="text-orange-300 font-semibold">Bronze</span>.
        </div>
      </div>
    </div>
  )
}